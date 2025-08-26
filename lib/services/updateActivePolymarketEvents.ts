import { prisma } from '@/lib/db/prisma'
import * as eventService from '@/lib/services/event-service'
import * as marketService from '@/lib/services/market-service'
import * as tagService from '@/lib/services/tag-service'
import type { NewMarket, NewEvent } from '@/lib/types/database'
import type { Event, Market, PolymarketEvent } from '@/lib/types'
import { mapTagsToCategory } from '@/lib/categorize'
import { fetchPolymarketEvents } from './polymarket-client'
import { Decimal } from '@prisma/client/runtime/library'

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

  // Find all active events (end_date in the future)
  const activeEvents = await prisma.event.findMany({
    where: {
      endDate: {
        gt: new Date()
      },
      marketProvider: 'Polymarket'
    },
    select: {
      id: true,
      title: true,
      endDate: true
    },
    orderBy: {
      endDate: 'asc' // Process events ending soonest first
    }
  })

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
  // Fetch events from now to 60 days in the future (covers most active events)
  const startDateMin = new Date()
  const endDateMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days ahead
  
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
      const processResult = await processAndUpsertBatchEvents(allActiveEventsData)
      updatedEvents.push(...processResult.updatedEvents)
      updatedMarkets.push(...processResult.updatedMarkets)
      
      console.log(`✓ Batch processed: ${processResult.updatedEvents.length} events, ${processResult.updatedMarkets.length} markets`)
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

/**
 * Process and upsert a batch of active events and their markets
 * This reuses the same logic as the main bulk update service
 */
async function processAndUpsertBatchEvents(eventsData: PolymarketEvent[]): Promise<{
  updatedEvents: Event[],
  updatedMarkets: Market[]
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
      updatedEvents: [],
      updatedMarkets: []
    }
  }

  // Sort events by volume (highest first) - same as bulk update
  const sortedEvents = validEvents.sort((a, b) => b.volume - a.volume)
  
  // Extract markets from events
  const allMarkets = sortedEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
  
  // Transform events data for database (same logic as bulk update)
  const eventsToInsert: NewEvent[] = sortedEvents.map((event) => {
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
      tags: event.tags ? JSON.stringify(event.tags) : null,
      category: category,
      providerCategory: event.category,
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: new Decimal(event.volume),
      marketProvider: "Polymarket",
      updatedAt: new Date(),
    }
  })

  // Transform markets data for database (same logic as bulk update)
  const marketsToInsert: NewMarket[] = allMarkets
    .filter((market): market is any => {
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
    .map((market: any) => {
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

  // Upsert events and markets in batch
  console.log(`Upserting active events batch: ${eventsToInsert.length} events, ${marketsToInsert.length} markets...`)
  const [updatedEvents, updatedMarkets] = await Promise.all([
    eventService.upsertEvents(prisma, eventsToInsert),
    marketsToInsert.length > 0 ? marketService.upsertMarkets(prisma, marketsToInsert) : Promise.resolve([])
  ])

  // Handle tags for batch (same logic as bulk update)
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
      await tagService.upsertTags(prisma, tagsToUpsert)
    }

    // Refresh event-tag links for active events
    const eventIdsInBatch = sortedEvents.map(e => e.id)
    await tagService.unlinkAllTagsFromEvents(prisma, eventIdsInBatch)
    const links: Array<{ eventId: string; tagId: string }> = []
    for (const ev of sortedEvents) {
      const tags = ev.tags || []
      for (const t of tags) {
        links.push({ eventId: ev.id, tagId: t.id })
      }
    }
    if (links.length > 0) {
      await tagService.linkTagsToEvents(prisma, links)
    }
  } catch (err) {
    console.error('Failed to upsert/link tags for active events batch:', err)
  }

  return {
    updatedEvents: updatedEvents.filter(Boolean) as Event[],
    updatedMarkets: updatedMarkets.filter(Boolean) as Market[]
  }
}