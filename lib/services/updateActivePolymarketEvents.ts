import { prisma } from '@/lib/db/prisma'
import type { Event, Market, PolymarketEvent } from '@/lib/types'
import { fetchPolymarketEventsByIds } from './polymarket-client'
import { processAndUpsertPolymarketBatch } from './polymarket-batch-processor'
import { getOpenMarketsDatabaseFilter } from '@/lib/utils/market-status'

/**
 * Updates only active Polymarket events (where end_date > NOW()) and their markets
 */
export async function updateActivePolymarketEvents(options: {
  delayMs?: number,
  maxRetries?: number,
  retryDelayMs?: number,
  timeoutMs?: number,
  userAgent?: string,
  maxBatchFailuresBeforeAbort?: number,
} = {}): Promise<{
  activeEventsCount: number,
  updatedEvents: Event[],
  updatedMarkets: Market[],
  totalRequests: number,
  errors: string[]
}> {
  const {
    delayMs = 500,
    maxBatchFailuresBeforeAbort = 3,
    ...fetchOptions
  } = options

  console.log('Starting active Polymarket events update...')


  const maxDaysUntilEnd = 45
  // Find all events with markets and filter for truly open markets
  // Only include events ending within the next 30 days for performance
  const eventsWithMarkets = await prisma.event.findMany({
    where: {
      marketProvider: 'Polymarket',
      endDate: {
        lte: new Date(Date.now() + maxDaysUntilEnd * 24 * 60 * 60 * 1000) 
      },
      markets: {
        some: getOpenMarketsDatabaseFilter({ maxDaysUntilEnd: maxDaysUntilEnd })
      }
    },
    select: {
      id: true,
      title: true,
      endDate: true,
      markets: {
        select: {
          closed: true,
          active: true,
          closedTime: true,
          endDate: true
        }
      }
    },
    orderBy: {
      endDate: 'asc' // Process events ending soonest first
    }
  })

  // Database query already filtered for truly open markets, just map to required format
  const activeEvents = eventsWithMarkets.map(event => ({
    id: event.id,
    title: event.title,
    endDate: event.endDate
  }))

  console.log(`Found ${activeEvents.length} active events to update`)

  if (activeEvents.length === 0) {
    return {
      activeEventsCount: 0,
      updatedEvents: [],
      updatedMarkets: [],
      totalRequests: 0,
      errors: []
    }
  }

  const updatedEvents: Event[] = []
  const updatedMarkets: Market[] = []
  const errors: string[] = []
  let totalRequests = 0

  // Extract just the event IDs
  const eventIds = activeEvents.map(e => e.id)
  console.log(`Fetching ${eventIds.length} events by ID: ${eventIds.slice(0, 5).join(', ')}... (showing first 5)`)

  // Fetch events in batches by ID (Polymarket API supports ?id=111&id=222&id=333)
  const allActiveEventsData: PolymarketEvent[] = []
  const batchSize = 50 // Reasonable batch size for URL length
  
  for (let i = 0; i < eventIds.length; i += batchSize) {
    const batchIds = eventIds.slice(i, i + batchSize)
    
    try {
      totalRequests++
      console.log(`Fetching batch ${totalRequests}/${Math.ceil(eventIds.length / batchSize)}: ${batchIds.length} event IDs`)
      
      const batchEvents = await fetchPolymarketEventsByIds(batchIds, fetchOptions)
      allActiveEventsData.push(...batchEvents)
      
      console.log(`✓ Batch ${totalRequests}: Got ${batchEvents.length}/${batchIds.length} events from Polymarket`)

      // Add delay between batch requests
      if (delayMs > 0 && i + batchSize < eventIds.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`✗ Failed to fetch batch ${totalRequests} (IDs: ${batchIds.slice(0, 3).join(', ')}...):`, errorMsg)
      errors.push(`Batch ${totalRequests}: ${errorMsg}`)
      
      // Continue with next batch instead of aborting completely
      if (errors.length >= maxBatchFailuresBeforeAbort) {
        console.error(`Too many batch failures (${errors.length}), stopping`)
        break
      }
    }
  }

  console.log(`Fetched ${allActiveEventsData.length}/${eventIds.length} events from ${totalRequests} API requests`)

  // Process all the active events we found
  if (allActiveEventsData.length > 0) {
    try {
      const processResult = await processAndUpsertPolymarketBatch(allActiveEventsData, {
        logPrefix: 'active-events-batch',
        enableTiming: false
      })
      updatedEvents.push(...processResult.processedEvents)
      updatedMarkets.push(...processResult.processedMarkets)
      
      console.log(`✓ Batch processed: ${processResult.processedEvents.length} events, ${processResult.processedMarkets.length} markets`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`✗ Failed to process active events batch:`, errorMsg)
      errors.push(`Batch processing: ${errorMsg}`)
    }
  }

  console.log(`Finished updating active events. Updated: ${updatedEvents.length}/${activeEvents.length}, Markets: ${updatedMarkets.length}, Errors: ${errors.length}`)

  return {
    activeEventsCount: activeEvents.length,
    updatedEvents,
    updatedMarkets,
    totalRequests,
    errors
  }
}

