import { prisma } from '@/lib/db/prisma'
import * as eventService from '@/lib/services/event-service'
import * as marketService from '@/lib/services/market-service'
import * as tagService from '@/lib/services/tag-service'
import type { NewMarket, NewEvent } from '@/lib/types/database'
import type { Event, Market, PolymarketEvent, PolymarketMarket } from '@/lib/types'
import { mapTagsToCategory } from '@/lib/categorize'
import { withDeadlockRetry } from '@/lib/utils/deadlock-retry'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Shared validation and transformation utilities for Polymarket data processing
 * Extracted from updatePolymarketEventsAndMarketData.ts and updateActivePolymarketEvents.ts
 */

export interface BatchProcessResult {
  processedEvents: Event[]
  processedMarkets: Market[]
  totalProcessed: number
}

/**
 * Validates a Polymarket event against expected structure
 */
export function validatePolymarketEvent(event: any): event is PolymarketEvent {
  return event !== null &&
         event !== undefined &&
         typeof event === 'object' && 
         typeof event.id === 'string' &&
         typeof event.title === 'string' &&
         typeof event.description === 'string' &&
         typeof event.volume === 'number' &&
         (event.slug === undefined || typeof event.slug === 'string') &&
         (event.tags === undefined || Array.isArray(event.tags))
}

/**
 * Validates a Polymarket market against expected structure
 */
export function validatePolymarketMarket(market: any): boolean {
  return market && 
         typeof market === 'object' && 
         typeof market.id === 'string' &&
         typeof market.question === 'string' &&
         typeof market.outcomePrices === 'string' &&
         typeof market.volume === 'string' &&
         typeof market.liquidity === 'string' &&
         typeof market.eventId === 'string'
}

/**
 * Transforms a PolymarketEvent to NewEvent database format
 */
export function transformEventToDbFormat(event: PolymarketEvent): NewEvent {
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
}

/**
 * Transforms a PolymarketMarket to NewMarket database format
 */
export function transformMarketToDbFormat(market: PolymarketMarket & { eventId: string }): NewMarket {
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
    eventId: market.eventId,
    description: market.description || null,
    slug: market.slug || null,
    icon: market.icon || null,
    image: market.image || null,
    outcomePrices: outcomePricesArray,
    outcomes: (() => {
      try {
        return market.outcomes ? JSON.parse(market.outcomes) : null
      } catch (error) {
        console.error(`Failed to parse outcomes for market ${market.id}:`, error)
        return null
      }
    })(),
    volume: new Decimal(market.volume),
    liquidity: new Decimal(market.liquidity),
    active: market.active ?? null,
    closed: market.closed ?? null,
    startDate: market.startDate ? new Date(market.startDate) : null,
    endDate: market.endDate ? new Date(market.endDate) : null,
    resolutionSource: market.resolutionSource || null,
    updatedAt: new Date(),
  }
}

/**
 * Process and upsert a batch of Polymarket events and their markets
 * Shared logic for both bulk updates and active event updates
 */
export async function processAndUpsertPolymarketBatch(
  eventsData: PolymarketEvent[],
  options: {
    logPrefix?: string
    enableTiming?: boolean
  } = {}
): Promise<BatchProcessResult> {
  const { logPrefix = 'batch', enableTiming = false } = options

  // Filter and validate events
  const validEvents = eventsData.filter(validatePolymarketEvent)

  if (validEvents.length === 0) {
    return {
      processedEvents: [],
      processedMarkets: [],
      totalProcessed: 0
    }
  }

  // Sort events by volume (highest first)
  const sortedEvents = validEvents.sort((a, b) => b.volume - a.volume)
  
  // Extract and validate markets from events
  const allMarkets = sortedEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
    .filter(validatePolymarketMarket)

  // Transform to database formats
  const eventsToInsert: NewEvent[] = sortedEvents.map(transformEventToDbFormat)
  const marketsToInsert: NewMarket[] = allMarkets.map(transformMarketToDbFormat)

  // Upsert events and markets with deadlock retry protection
  console.log(`Upserting ${logPrefix}: ${eventsToInsert.length} events, ${marketsToInsert.length} markets...`)
  
  const startTime = enableTiming ? Date.now() : 0
  if (enableTiming) console.time(`${logPrefix}-events-upsert`)
  
  const [processedEvents, processedMarkets] = await withDeadlockRetry(
    async () => Promise.all([
      eventService.upsertEvents(prisma, eventsToInsert),
      marketsToInsert.length > 0 ? marketService.upsertMarkets(prisma, marketsToInsert) : Promise.resolve([])
    ]),
    { logPrefix: `${logPrefix}-upsert` }
  )

  if (enableTiming) {
    console.timeEnd(`${logPrefix}-events-upsert`)
    console.time(`${logPrefix}-tags-processing`)
  }

  // Process tags with deadlock retry protection
  try {
    await withDeadlockRetry(
      async () => processEventTags(sortedEvents),
      { logPrefix: `${logPrefix}-tags` }
    )
  } catch (err) {
    console.error(`Failed to process tags for ${logPrefix}:`, err)
  }

  if (enableTiming) {
    console.timeEnd(`${logPrefix}-tags-processing`)
    const totalTime = Date.now() - startTime
    console.log(`${logPrefix} processing completed in ${totalTime}ms`)
  }

  return {
    processedEvents: processedEvents.filter(Boolean) as Event[],
    processedMarkets: processedMarkets.filter(Boolean) as Market[],
    totalProcessed: validEvents.length
  }
}

/**
 * Process and upsert tags for a batch of events
 */
async function processEventTags(events: PolymarketEvent[]): Promise<void> {
  // Collect unique tags
  const uniqueTagsMap = new Map<string, {
    id: string
    label: string
    slug?: string | null
    forceShow?: boolean | null
    providerUpdatedAt?: Date | null
    provider?: string | null
  }>()

  for (const event of events) {
    const tags = event.tags || []
    for (const tag of tags) {
      if (!uniqueTagsMap.has(tag.id)) {
        uniqueTagsMap.set(tag.id, {
          id: tag.id,
          label: tag.label,
          slug: tag.slug ?? null,
          forceShow: tag.forceShow ?? null,
          providerUpdatedAt: tag.updatedAt ? new Date(tag.updatedAt) : null,
          provider: 'Polymarket',
        })
      }
    }
  }

  // Upsert tags
  const tagsToUpsert = Array.from(uniqueTagsMap.values())
  if (tagsToUpsert.length > 0) {
    await tagService.upsertTags(prisma, tagsToUpsert)
  }

  // Update event-tag links in transaction to prevent partial updates
  const eventIds = events.map(e => e.id)
  const links: Array<{ eventId: string; tagId: string }> = []
  for (const event of events) {
    const tags = event.tags || []
    for (const tag of tags) {
      links.push({ eventId: event.id, tagId: tag.id })
    }
  }

  // Execute tag link operations atomically to reduce deadlock potential
  if (links.length > 0) {
    await tagService.unlinkAllTagsFromEvents(prisma, eventIds)
    await tagService.linkTagsToEvents(prisma, links)
  } else {
    await tagService.unlinkAllTagsFromEvents(prisma, eventIds)
  }
}