import { db } from '@/lib/db'
import { events, markets } from '@/lib/db/schema'
import { eq, desc, gt, sql } from 'drizzle-orm'
import type { Event, NewEvent, Market } from '@/lib/types'

import { eventQueries, marketQueries, type NewMarket } from '@/lib/db/queries'
import type { PolymarketEvent, PolymarketMarket } from '@/lib/types'
import { mapTagsToCategory, CATEGORIES } from '@/lib/categorize'

export async function getTrendingEvents(): Promise<Event[]> {
  return await db.query.events.findMany({
    where: (events, { gt }) => gt(events.trendingRank, 0),
    orderBy: (events, { desc }) => [desc(events.trendingRank)],
    limit: 10
  })
}

export async function getTrendingEventsWithMarkets(): Promise<(Event & { markets: Market[] })[]> {
  // Get trending events first
  const trendingEvents = await db.query.events.findMany({
    where: (events, { gt }) => gt(events.trendingRank, 0),
    orderBy: (events, { desc }) => [desc(events.trendingRank)],
    limit: 10
  })

  // Get all markets for these events in a single query
  const eventIds = trendingEvents.map(event => event.id)
  const allMarkets = await db.query.markets.findMany({
    where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
    orderBy: (markets, { desc }) => [desc(markets.volume)]
  })

  // Group markets by eventId
  const marketsByEventId = allMarkets.reduce((acc, market) => {
    if (market.eventId) {
      if (!acc[market.eventId]) {
        acc[market.eventId] = []
      }
      acc[market.eventId].push(market)
    }
    return acc
  }, {} as Record<string, Market[]>)

  // Combine events with their markets
  return trendingEvents.map(event => ({
    ...event,
    markets: marketsByEventId[event.id] || []
  }))
}

export async function getEventById(id: string): Promise<Event | null> {
  const result = await db.query.events.findFirst({
    where: (events, { eq }) => eq(events.id, id)
  })
  return result || null
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const result = await db.query.events.findFirst({
    where: (events, { eq }) => eq(events.slug, slug)
  })
  return result || null
}

export async function createEvent(eventData: NewEvent): Promise<Event> {
  const [result] = await db.insert(events).values(eventData).returning()
  return result
}

export async function updateEvent(id: string, eventData: Partial<NewEvent>): Promise<Event | null> {
  const [result] = await db
    .update(events)
    .set({ ...eventData, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning()
  return result || null
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await db.delete(events).where(eq(events.id, id))
  return result.rowCount > 0
}

export async function getEventsByCategory(categoryId: number): Promise<Event[]> {
  return await db.query.events.findMany({
    where: (events, { eq }) => eq(events.category, categoryId),
    orderBy: (events, { desc }) => [desc(events.volume)]
  })
}

export async function getEventsByCategoryWithMarkets(categoryId: number): Promise<(Event & { markets: Market[] })[]> {
  // Get events by category
  const categoryEvents = await db.query.events.findMany({
    where: (events, { eq }) => eq(events.category, categoryId),
    orderBy: (events, { desc }) => [desc(events.volume)]
  })

  // Get all markets for these events in a single query
  const eventIds = categoryEvents.map(event => event.id)
  const allMarkets = await db.query.markets.findMany({
    where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
    orderBy: (markets, { desc }) => [desc(markets.volume)]
  })

  // Group markets by eventId
  const marketsByEventId = allMarkets.reduce((acc, market) => {
    if (market.eventId) {
      if (!acc[market.eventId]) {
        acc[market.eventId] = []
      }
      acc[market.eventId].push(market)
    }
    return acc
  }, {} as Record<string, Market[]>)

  // Combine events with their markets
  return categoryEvents.map(event => ({
    ...event,
    markets: marketsByEventId[event.id] || []
  }))
}

export async function getCategoryStats(): Promise<Array<{
  categoryId: number;
  categoryName: string;
  eventCount: number;
}>> {
  // Get event counts by category
  const result = await db
    .select({
      category: events.category,
      count: sql<number>`count(*)::int`
    })
    .from(events)
    .where(sql`${events.category} IS NOT NULL`)
    .groupBy(events.category)

  // Map to include category names
  return result.map(row => ({
    categoryId: row.category!,
    categoryName: CATEGORIES[row.category as keyof typeof CATEGORIES] || 'Unknown',
    eventCount: row.count
  })).sort((a, b) => b.eventCount - a.eventCount)
}



/**
 * Safely pulls all events from Polymarket API with throttling and pagination
 * 
 * @param options Configuration options for the API calls
 * @returns Promise with all fetched events and markets
 */
export async function fetchAllPolymarketEventsWithThrottling(options: {
  limit?: number,           // Number of events per request (default: 100)
  delayMs?: number,         // Delay between requests in milliseconds (default: 1000)
  maxRetries?: number,      // Maximum number of retries per request (default: 3)
  retryDelayMs?: number,    // Delay before retry in milliseconds (default: 2000)
  timeoutMs?: number,       // Request timeout in milliseconds (default: 30000)
  userAgent?: string,       // Custom User-Agent header
} = {}): Promise<{
  events: PolymarketEvent[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  const {
    limit = 100,
    delayMs = 1000,
    maxRetries = 3,
    retryDelayMs = 2000,
    timeoutMs = 30000,
    userAgent = "BetterAI/1.0"
  } = options

  const allEvents: PolymarketEvent[] = []
  const errors: string[] = []
  let totalRequests = 0
  let offset = 0
  let hasMoreData = true

  console.log(`Starting to fetch all Polymarket events with limit=${limit}, delay=${delayMs}ms`)

  while (hasMoreData) {
    try {
      totalRequests++
      console.log(`Fetching batch ${totalRequests} with offset=${offset}, limit=${limit}`)

      const url = `https://gamma-api.polymarket.com/events?limit=${limit}&offset=${offset}`
      
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
                  allEvents.push(...retryData)
                  console.log(`Retry successful, got ${retryData.length} events`)
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

      // Filter and validate events
      const validEvents = data.filter((event): event is PolymarketEvent => {
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

      allEvents.push(...validEvents)
      console.log(`Batch ${totalRequests}: Got ${data.length} events, ${validEvents.length} valid`)

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
          const url = `https://gamma-api.polymarket.com/events?limit=${limit}&offset=${offset}`
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              "User-Agent": userAgent,
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data)) {
              const validEvents = data.filter((event): event is PolymarketEvent => {
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
              
              allEvents.push(...validEvents)
              console.log(`Retry successful, got ${data.length} events`)
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

  console.log(`Finished fetching events. Total: ${allEvents.length}, Requests: ${totalRequests}, Errors: ${errors.length}`)
  
  return {
    events: allEvents,
    totalFetched: allEvents.length,
    totalRequests,
    errors
  }
}

/**
 * Updates all Polymarket events and markets with proper throttling and pagination
 */
export async function updatePolymarketAllEventsAndMarketDataWithThrottling(options: {
  limit?: number,
  delayMs?: number,
  maxRetries?: number,
  retryDelayMs?: number,
  timeoutMs?: number,
  userAgent?: string,
} = {}): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  console.log("Starting throttled update of all Polymarket events...")
  
  const { events: allEvents, totalFetched, totalRequests, errors } = 
    await fetchAllPolymarketEventsWithThrottling(options)

  if (allEvents.length === 0) {
    console.log("No events fetched, returning empty results")
    return {
      insertedEvents: [],
      insertedMarkets: [],
      totalFetched,
      totalRequests,
      errors
    }
  }

  // Sort events by volume (highest first)
  const sortedEvents = allEvents.sort((a, b) => b.volume - a.volume)
  
  console.log(`Processing ${sortedEvents.length} events...`)

  // Extract markets from events
  const allMarkets = sortedEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
  
  console.log(`Extracted ${allMarkets.length} markets from events`)

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
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: event.volume.toString(),
      trendingRank: null, // No trending rank for all events
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
        outcomePrices: outcomePricesArray,
        volume: market.volume,
        liquidity: market.liquidity,
        description: market.description,
        endDate: market.endDate ? new Date(market.endDate) : null,
        updatedAt: new Date(),
      }
    })

  // Insert new data
  console.log(`Upserting ${eventsToInsert.length} events...`)
  const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)

  console.log(`Upserting ${marketsToInsert.length} markets...`)
  const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)

  return {
    insertedEvents: insertedEvents.filter(Boolean) as Event[],
    insertedMarkets: insertedMarkets.filter(Boolean) as Market[],
    totalFetched,
    totalRequests,
    errors
  }
}



