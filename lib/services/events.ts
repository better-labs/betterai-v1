import { eventQueries, marketQueries, type NewMarket } from '@/lib/db/queries'
import type { Event, NewEvent, Market, PolymarketEvent, PolymarketMarket } from '@/lib/types'
import { mapTagsToCategory } from '@/lib/categorize'



/**
 * Updates all Polymarket events and markets with proper throttling and pagination
 */
export async function updatePolymarketEventsAndMarketData(options: {
  limit?: number,
  delayMs?: number,
  maxRetries?: number,
  retryDelayMs?: number,
  timeoutMs?: number,
  userAgent?: string,
  daysToFetch?: number,
} = {}): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  const {
    limit = 200,
    delayMs = 1000,
    maxRetries = 3,
    retryDelayMs = 2000,
    timeoutMs = 30000,
    userAgent = "BetterAI/1.0",
    daysToFetch = 10
  } = options

  console.log("Starting throttled update of all Polymarket events with batch processing...")
  
  const allInsertedEvents: Event[] = []
  const allInsertedMarkets: Market[] = []
  const errors: string[] = []
  let totalRequests = 0
  let offset = 0
  let hasMoreData = true
  let totalFetched = 0

  console.log(`Starting to fetch and process Polymarket events with limit=${limit}, delay=${delayMs}ms`)

  // Local function to construct the API URL
  const buildEventsURL = (offset: number, limit: number): string => {
    const baseEventsURL = 'https://gamma-api.polymarket.com/events'
    const defaultStartDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const defaultEndDate = new Date(Date.now() + daysToFetch * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const params = `start_date_min=${defaultStartDate}&end_date_max=${defaultEndDate}&ascending=true`
    return `${baseEventsURL}?${params}&offset=${offset}&limit=${limit}`
  }

  while (hasMoreData) {
    try {
      totalRequests++
      console.log(`Fetching batch ${totalRequests} with offset=${offset}, limit=${limit}`)

      const url = buildEventsURL(offset, limit)
      console.log('url:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`
        console.error(`Request failed: ${errorMsg}`)
        
        if (response.status === 429) {
          // Rate limited - wait longer
          console.log(`Rate limited, waiting ${retryDelayMs * 2}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * 2))
          continue
        }
        
        if (response.status >= 500) {
          // Server error - retry with exponential backoff
          for (let retry = 1; retry <= maxRetries; retry++) {
            console.log(`Server error, retrying ${retry}/${maxRetries}...`)
            await new Promise(resolve => setTimeout(resolve, retryDelayMs * retry))
            
            try {
              const retryResponse = await fetch(url, {
                headers: {
                  Accept: "application/json",
                  "User-Agent": userAgent,
                },
                signal: controller.signal
              })
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                if (Array.isArray(retryData)) {
                  // Process and upsert this batch
                  const batchResult = await processAndUpsertBatch(retryData)
                  allInsertedEvents.push(...batchResult.insertedEvents)
                  allInsertedMarkets.push(...batchResult.insertedMarkets)
                  totalFetched += batchResult.totalFetched
                  console.log(`Retry successful, processed ${retryData.length} events`)
                  break
                }
              }
            } catch (retryError) {
              console.error(`Retry ${retry} failed:`, retryError)
              if (retry === maxRetries) {
                errors.push(`Failed after ${maxRetries} retries: ${errorMsg}`)
                hasMoreData = false
                break
              }
            }
          }
          continue
        }
        
        errors.push(errorMsg)
        hasMoreData = false
        break
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        console.error("Invalid response format - expected array")
        errors.push("Invalid response format from API")
        hasMoreData = false
        break
      }

      // Process and upsert this batch
      console.log(`Processing batch ${totalRequests} with ${data.length} events...`)
      const batchResult = await processAndUpsertBatch(data)
      allInsertedEvents.push(...batchResult.insertedEvents)
      allInsertedMarkets.push(...batchResult.insertedMarkets)
      totalFetched += batchResult.totalFetched

      console.log(`Batch ${totalRequests}: Processed ${data.length} events, ${batchResult.insertedEvents.length} events upserted, ${batchResult.insertedMarkets.length} markets upserted`)

      // Check if we've reached the end
      if (data.length < limit) {
        console.log(`Received ${data.length} events (less than limit ${limit}), stopping pagination`)
        hasMoreData = false
      } else {
        offset += limit
        console.log(`Moving to next batch, new offset: ${offset}`)
      }

      // Throttle requests
      if (hasMoreData) {
        console.log(`Waiting ${delayMs}ms before next request...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`Request error:`, errorMsg)
      errors.push(errorMsg)
      
      // If it's an abort error (timeout), try to continue
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request timed out, continuing to next batch...")
        offset += limit
        continue
      }
      
      // For other errors, try retrying
      for (let retry = 1; retry <= maxRetries; retry++) {
        console.log(`Retrying ${retry}/${maxRetries} after error...`)
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * retry))
        
        try {
          const url = buildEventsURL(offset, limit)
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              "User-Agent": userAgent,
            }
          })
          console.log('url:', url)

          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data)) {
              // Process and upsert this batch
              const batchResult = await processAndUpsertBatch(data)
              allInsertedEvents.push(...batchResult.insertedEvents)
              allInsertedMarkets.push(...batchResult.insertedMarkets)
              totalFetched += batchResult.totalFetched
              console.log(`Retry successful, processed ${data.length} events`)
              break
            }
          }
        } catch (retryError) {
          console.error(`Retry ${retry} failed:`, retryError)
          if (retry === maxRetries) {
            errors.push(`Failed after ${maxRetries} retries: ${errorMsg}`)
            hasMoreData = false
            break
          }
        }
      }
    }
  }

  console.log(`Finished processing all batches. Total: ${totalFetched}, Requests: ${totalRequests}, Errors: ${errors.length}`)
  
  return {
    insertedEvents: allInsertedEvents,
    insertedMarkets: allInsertedMarkets,
    totalFetched,
    totalRequests,
    errors
  }
}

/**
 * Helper function to process and upsert a batch of events and their markets
 */
async function processAndUpsertBatch(eventsData: PolymarketEvent[]): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number
}> {
  // Filter and validate events
  const validEvents = eventsData.filter((event): event is PolymarketEvent => {
    const isValid = event && 
           typeof event === 'object' && 
           typeof event.id === 'string' &&
           typeof event.title === 'string' &&
           typeof event.description === 'string' &&
           typeof event.volume === 'number' &&
           (event.slug === undefined || typeof event.slug === 'string') &&
           (event.tags === undefined || Array.isArray(event.tags))
    
    return isValid
  })

  if (validEvents.length === 0) {
    return {
      insertedEvents: [],
      insertedMarkets: [],
      totalFetched: 0
    }
  }

  // Sort events by volume (highest first)
  const sortedEvents = validEvents.sort((a, b) => b.volume - a.volume)
  
  // Extract markets from events
  const allMarkets = sortedEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
  
  // Transform events data for database
  const eventsToInsert: NewEvent[] = sortedEvents.map((event) => {
    // Calculate category based on tags
    const tags = event.tags || []
    const tagLabels = tags.map(tag => tag.label)
    const category = mapTagsToCategory(tagLabels)
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug || null,
      icon: event.icon || null,
      tags: event.tags || null,
      category: category,
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: event.volume.toString(),
      
      marketProvider: "polymarket",
      updatedAt: new Date(),
    }
  })

  // Transform markets data for database
  const marketsToInsert: NewMarket[] = allMarkets
    .filter((market): market is PolymarketMarket & { eventId: string } => {
      const isValid = market && 
             typeof market === 'object' && 
             typeof market.id === 'string' &&
             typeof market.question === 'string' &&
             typeof market.outcomePrices === 'string' &&
             typeof market.volume === 'string' &&
             typeof market.liquidity === 'string' &&
             typeof market.eventId === 'string'
      
      return isValid
    })
    .map((market: PolymarketMarket) => {
      let outcomePricesArray: string[] = []
      try {
        const parsed = JSON.parse(market.outcomePrices)
        outcomePricesArray = Array.isArray(parsed) ? parsed.map(p => p.toString()) : []
      } catch (error) {
        console.error(`Failed to parse outcomePrices for market ${market.id}:`, error)
      }
      
      return {
        id: market.id,
        question: market.question,
        eventId: market.eventId,
        slug: market.slug || null,
        outcomePrices: outcomePricesArray,
        outcomes: market.outcomes ? JSON.parse(market.outcomes) : null,
        volume: market.volume,
        liquidity: market.liquidity,
        description: market.description,
        active: market.active,
        closed: market.closed,
        startDate: market.startDate ? new Date(market.startDate) : null,
        endDate: market.endDate ? new Date(market.endDate) : null,
        resolutionSource: market.resolutionSource || null,
        updatedAt: new Date(),
      }
    })

  // Upsert events and markets for this batch
  console.log(`Upserting batch: ${eventsToInsert.length} events, ${marketsToInsert.length} markets...`)
  const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)
  const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)

  return {
    insertedEvents: insertedEvents.filter(Boolean) as Event[],
    insertedMarkets: insertedMarkets.filter(Boolean) as Market[],
    totalFetched: validEvents.length
  }
} 