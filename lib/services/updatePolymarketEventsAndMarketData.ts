import { eventQueries, marketQueries, tagQueries, type NewMarket, type NewEvent } from '@/lib/db/queries'
import type { Event, Market, PolymarketEvent, PolymarketMarket } from '@/lib/types'
import { mapTagsToCategory } from '@/lib/categorize'
import { fetchPolymarketEvents } from './polymarket-client'
import { Decimal } from '@prisma/client/runtime/library'

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
  daysToFetchPast?: number,
  daysToFetchFuture?: number,
} = {}): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  const {
    limit = 100,
    delayMs = 1000,
    daysToFetchPast = 8,
    daysToFetchFuture = 21,
    ...fetchOptions
  } = options

  console.log("Starting throttled update of all Polymarket events with batch processing...")
  console.log(`Processing events with batch limit: ${limit}, daysToFetchPast: ${daysToFetchPast}, daysToFetchFuture: ${daysToFetchFuture}`)

  const allInsertedEvents: Event[] = []
  const allInsertedMarkets: Market[] = []
  const errors: string[] = []
  let totalRequests = 0
  let offset = 0
  let hasMoreData = true
  let totalFetched = 0
  
  // Compute a fixed date window for this run
  const MS_IN_DAY = 24 * 60 * 60 * 1000
  const startDateMin = new Date(Date.now() - daysToFetchPast * MS_IN_DAY)
  const endDateMax = new Date(Date.now() + daysToFetchFuture * MS_IN_DAY)
  

  while (hasMoreData) {
    try {
      totalRequests++
      const eventsData = await fetchPolymarketEvents(offset, limit, startDateMin, endDateMax, fetchOptions)
      
      if (eventsData.length > 0) {
        const batchResult = await processAndUpsertBatch(eventsData)
        allInsertedEvents.push(...batchResult.insertedEvents)
        allInsertedMarkets.push(...batchResult.insertedMarkets)
        totalFetched += batchResult.totalFetched
        console.log(`Batch ${totalRequests}: Processed ${eventsData.length} events, ${batchResult.insertedEvents.length} events upserted, ${batchResult.insertedMarkets.length} markets upserted`)
      }

      if (eventsData.length < limit) {
        hasMoreData = false
      } else {
        offset += limit
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`Failed to process batch with offset ${offset}:`, errorMsg)
      errors.push(errorMsg)
      // Decide if we should stop or continue on error
      hasMoreData = false // Stop for now
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
      image: event.image || null,
      tags: event.tags || null,
      category: category,
      providerCategory: event.category,
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: new Decimal(event.volume),
      marketProvider: "Polymarket",
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
      let outcomePricesArray: Decimal[] = []
      try {
        const parsed = JSON.parse(market.outcomePrices)
        outcomePricesArray = Array.isArray(parsed) ? parsed.map(p => new Decimal(p.toString())) : []
      } catch (error) {
        console.error(`Failed to parse outcomePrices for market ${market.id}:`, error)
      }
      
      return {
        id: market.id,
        question: market.question,
        eventId: market.eventId!,
        slug: market.slug || null,
        icon: market.icon || null,
        image: market.image || null,
        outcomePrices: outcomePricesArray,
        outcomes: market.outcomes ? JSON.parse(market.outcomes) : null,
        volume: new Decimal(market.volume),
        liquidity: new Decimal(market.liquidity),
        description: market.description || null,
        active: market.active ?? null,
        closed: market.closed ?? null,
        startDate: market.startDate ? new Date(market.startDate) : null,
        endDate: market.endDate ? new Date(market.endDate) : null,
        resolutionSource: market.resolutionSource || null,
        updatedAt: new Date(),
      }
    })

  // Upsert events and markets for this batch with timings for visibility
  console.log(`Upserting batch: ${eventsToInsert.length} events, ${marketsToInsert.length} markets...`)
  console.time('events-upsert')
  const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)
  console.timeEnd('events-upsert')
  console.time('markets-upsert')
  const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)
  console.timeEnd('markets-upsert')

  // Normalize and upsert tags, then link to events
  try {
    const uniqueTagsMap = new Map<string, { id: string; label: string; slug?: string | null; forceShow?: boolean | null; providerUpdatedAt?: Date | null; provider?: string | null }>()
    for (const ev of sortedEvents) {
      const tags = (ev.tags || [])
      for (const t of tags) {
        if (!uniqueTagsMap.has(t.id)) {
          uniqueTagsMap.set(t.id, {
            id: t.id,
            label: t.label,
            slug: t.slug ?? null,
            forceShow: t.forceShow ?? null,
            providerUpdatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
            provider: 'Polymarket',
          })
        }
      }
    }
    const tagsToUpsert = Array.from(uniqueTagsMap.values())
    if (tagsToUpsert.length > 0) {
      await tagQueries.upsertTags(tagsToUpsert)
    }

    // Refresh event-tag links to reflect current provider tags
    const eventIdsInBatch = sortedEvents.map(e => e.id)
    // Set-based delete: remove all existing links for this batch of events using a single SQL statement
    console.time('tags-unlink')
    await tagQueries.unlinkAllTagsFromEvents(eventIdsInBatch)
    console.timeEnd('tags-unlink')
    const links: Array<{ eventId: string; tagId: string }> = []
    for (const ev of sortedEvents) {
      const tags = ev.tags || []
      for (const t of tags) {
        links.push({ eventId: ev.id, tagId: t.id })
      }
    }
    if (links.length > 0) {
      console.time('tags-link')
      await tagQueries.linkTagsToEvents(links)
      console.timeEnd('tags-link')
    }
  } catch (err) {
    console.error('Failed to upsert/link tags for batch:', err)
  }

  return {
    insertedEvents: insertedEvents.filter(Boolean) as Event[],
    insertedMarkets: insertedMarkets.filter(Boolean) as Market[],
    totalFetched: validEvents.length
  }
} 