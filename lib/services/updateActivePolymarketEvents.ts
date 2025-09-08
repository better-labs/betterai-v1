import { prisma } from '@/lib/db/prisma'
import type { Event, Market, PolymarketEvent } from '@/lib/types'
import { fetchPolymarketEvents } from './polymarket-client'
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

  // Find all events with markets and filter for truly open markets
  // Only include events ending within the next 30 days for performance
  const eventsWithMarkets = await prisma.event.findMany({
    where: {
      marketProvider: 'Polymarket',
      endDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // Events ending within 30 days
      },
      markets: {
        some: getOpenMarketsDatabaseFilter({ maxDaysUntilEnd: 30 })
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

  // Create a Set of active event IDs for fast lookup
  const activeEventIds = new Set(activeEvents.map(e => e.id))
  console.log(`Active event IDs: ${Array.from(activeEventIds).slice(0, 5).join(', ')}... (showing first 5)`)

  // Use batch API calls to fetch events efficiently
  // Fetch all events regardless of start date (use very early date to get everything)
  const startDateMin = new Date('2024-01-01') // Very early date to get all events
  const endDateMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead
  
  const allActiveEventsData: PolymarketEvent[] = []
  let offset = 0
  const batchSize = 100
  let hasMoreData = true
  let consecutiveErrors = 0

  // Fetch all events in batches and filter for our active ones
  while (hasMoreData && allActiveEventsData.length < activeEvents.length) {
    try {
      totalRequests++
      console.log(`Fetching batch ${totalRequests}: offset=${offset}, limit=${batchSize}`)
      
      const batchEvents = await fetchPolymarketEvents(
        offset,
        batchSize,
        startDateMin,
        endDateMax,
        fetchOptions
      )

      if (batchEvents.length === 0) {
        hasMoreData = false
        break
      }

      // Filter to only include our active events
      const relevantEvents = batchEvents.filter(event => activeEventIds.has(event.id))
      allActiveEventsData.push(...relevantEvents)
      
      console.log(`Batch ${totalRequests}: Got ${batchEvents.length} events, ${relevantEvents.length} are active in our DB`)

      // Stop if we found all our active events or got less than batch size
      if (batchEvents.length < batchSize || allActiveEventsData.length >= activeEvents.length * 0.9) {
        hasMoreData = false
      } else {
        offset += batchSize
        // Add delay between batch requests
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }

      consecutiveErrors = 0 // Reset on success

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`✗ Failed to fetch batch at offset ${offset}:`, errorMsg)
      errors.push(`Batch ${totalRequests}: ${errorMsg}`)
      
      consecutiveErrors++
      if (consecutiveErrors >= maxBatchFailuresBeforeAbort) {
        console.error(`Aborting after ${consecutiveErrors} consecutive batch failures`)
        break
      } else {
        const backoffMs = (fetchOptions.retryDelayMs ?? 2000) * consecutiveErrors
        console.warn(`Backing off for ${backoffMs}ms before retrying batch`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        // Don't increment offset, retry the same batch
      }
    }
  }

  console.log(`Fetched ${allActiveEventsData.length} active events from ${totalRequests} batch requests`)

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

