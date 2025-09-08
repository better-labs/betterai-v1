import type { PrismaClient, Event, Market, Category } from '@/lib/generated/prisma'
import { mapEventToDTO, mapEventsToDTO } from '@/lib/dtos'
import type { EventDTO } from '@/lib/types'
import { CATEGORY_DISPLAY_NAME } from '@/lib/categorize'

/**
 * Global tag filter for excluding certain types of markets from trending
 */
export const tagFilter = ["Crypto", "Hide From New", "Weekly", "Recurring"] 

/**
 * Event service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs (never raw Prisma models)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getTrendingEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<Event[]> {
  return await db.event.findMany({
    orderBy: { volume: 'desc' },
    take: 10
  })
}

/**
 * Gets trending events with their associated markets, sorted by prediction status then volume.
 * Applies business filters to show relevant, active events for predictions.
 * 
 * @param db - Prisma database client
 * @param withPredictions - If true, prioritize markets with predictions (sort first)
 * @param predictionDaysLookBack - Number of days to look back for recent predictions (default: 3)
 * @returns Array of events with their highest-volume markets and prediction data
 * 
 * Applied filters:
 * - Future events only (endDate > now)
 * - Excludes crypto-tagged events
 * - Sorts markets with predictions first, then high-volume markets without predictions
 * - Returns one market per event (highest priority by prediction status, then volume/delta)
 */
export async function getTrendingMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  withPredictions = false,
  predictionDaysLookBack = 4,
  tagIds?: string[]
): Promise<any[]> {
  const filterDate = new Date(Date.now() - predictionDaysLookBack * 24 * 60 * 60 * 1000)
  
  // Direct market-focused approach: query markets that are open, then group by event
  const marketWhereClause: any = {
    closed: false, // Only open markets - ALWAYS enforced
    updatedAt: {
      gte: filterDate
    }
  }
  
  // Handle tag filtering at the event level (without overwriting closed filter)
  if (tagIds && tagIds.length > 0) {
    marketWhereClause.event = {
      eventTags: {
        some: {
          tagId: {
            in: tagIds
          }
        }
      }
    }
  } else {
    // Default behavior: exclude markets from events with crypto tags
    marketWhereClause.event = {
      NOT: {
        eventTags: {
          some: {
            tag: {
              label: {
                in: tagFilter,
                mode: 'insensitive' as any
              }
            }
          }
        }
      }
    }
  }

  const markets = await db.market.findMany({
    where: marketWhereClause,
    orderBy: { volume: 'desc' },
    take: 100, // Get more markets then we'll group by event
    include: {
      event: {
        include: {
          eventTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  label: true,
                  slug: true,
                  forceShow: true
                }
              }
            }
          }
        }
      },
      predictions: {
        where: {
          createdAt: {
            gte: filterDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          outcomes: true,
          outcomesProbabilities: true,
          createdAt: true,
          modelName: true,
          predictionResult: true,
        }
      }
    }
  })

  // Group markets by event and find the best market per event
  const eventMarketsMap = new Map<string, any[]>()
  
  // Group markets by event
  for (const market of markets) {
    const eventId = market.event.id
    if (!eventMarketsMap.has(eventId)) {
      eventMarketsMap.set(eventId, [])
    }
    eventMarketsMap.get(eventId)!.push(market)
  }
  
  // For each event, find the best market prioritizing predictions then volume
  const eventsWithBestMarket = Array.from(eventMarketsMap.entries())
    .map(([eventId, eventMarkets]) => {
      if (!eventMarkets || eventMarkets.length === 0) return null
      
      const event = eventMarkets[0].event // All markets have the same event
      
      // Split markets into those with and without predictions
      const marketsWithPredictions = eventMarkets.filter((market: any) => 
        market.predictions && market.predictions.length > 0
      )
      const marketsWithoutPredictions = eventMarkets.filter((market: any) => 
        !market.predictions || market.predictions.length === 0
      )
      
      let bestMarket = null
      
      if (marketsWithPredictions.length > 0) {
        // Calculate delta for markets with predictions
        const marketsWithDelta = marketsWithPredictions.map((market: any) => {
          const prediction = market.predictions[0]
          const marketProb = Array.isArray(market.outcomePrices) 
            ? market.outcomePrices[0] 
            : typeof market.outcomePrices === 'string' 
              ? JSON.parse(market.outcomePrices)[0] 
              : 0.5
          const predictionProb = Array.isArray(prediction.outcomesProbabilities)
            ? prediction.outcomesProbabilities[0]
            : typeof prediction.outcomesProbabilities === 'string'
              ? JSON.parse(prediction.outcomesProbabilities)[0]
              : 0.5
          
          const delta = Math.abs(marketProb - predictionProb)
          
          return {
            ...market,
            delta,
            hasPrediction: true
          }
        })
        
        // Find markets with significant delta
        const significantDeltaMarkets = marketsWithDelta.filter((market: any) => market.delta > 0.009)
        
        if (significantDeltaMarkets.length > 0) {
          // Sort by highest delta and take the best one
          bestMarket = significantDeltaMarkets.sort((a: any, b: any) => b.delta - a.delta)[0]
        } else {
          // If no significant delta, take the highest volume market with predictions
          bestMarket = marketsWithDelta.sort((a: any, b: any) => 
            parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0')
          )[0]
          bestMarket.hasPrediction = true
        }
      }
      
      // If no best market with predictions found, fall back to highest volume market
      if (!bestMarket && marketsWithoutPredictions.length > 0) {
        bestMarket = marketsWithoutPredictions.sort((a: any, b: any) => 
          parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0')
        )[0]
        bestMarket.hasPrediction = false
      }
      
      // If still no market found, take any market
      if (!bestMarket) {
        bestMarket = eventMarkets[0]
        bestMarket.hasPrediction = marketsWithPredictions.includes(bestMarket)
      }
      
      return {
        ...event,
        markets: [bestMarket] // Return only the best market
      }
    })
    .filter((event: any) => event !== null)
  
  // Sort events: predicted markets first, then by volume
  const sortedEvents = eventsWithBestMarket.sort((a: any, b: any) => {
    const aHasPrediction = a.markets[0]?.hasPrediction || false
    const bHasPrediction = b.markets[0]?.hasPrediction || false
    
    // Predicted markets first
    if (aHasPrediction && !bHasPrediction) return -1
    if (!aHasPrediction && bHasPrediction) return 1
    
    // Within same prediction status, sort by volume
    const aVolume = parseFloat(a.volume?.toString() || '0')
    const bVolume = parseFloat(b.volume?.toString() || '0')
    return bVolume - aVolume
  })
  
  return sortedEvents
}


export async function getEventById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<Event | null> {
  return await db.event.findUnique({
    where: { id }
  })
}

export async function getEventByIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<EventDTO | null> {
  const event = await getEventById(db, id)
  if (!event) return null
  return mapEventToDTO(event)
}

export async function getEventBySlug(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  slug: string
): Promise<Event | null> {
  return await db.event.findFirst({
    where: { slug }
  })
}

export async function createEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventData: any
): Promise<Event> {
  return await db.event.create({ data: eventData })
}

export async function updateEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  eventData: Partial<any>
): Promise<Event | null> {
  return await db.event.update({
    where: { id },
    data: { ...eventData, updatedAt: new Date() }
  })
}

export async function deleteEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<boolean> {
  const result = await db.event.delete({ where: { id } })
  return !!result
}

export async function getEventsByCategory(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  category: Category
): Promise<Event[]> {
  return await db.event.findMany({
    where: { category },
    orderBy: { volume: 'desc' }
  })
}

export async function getEventsByCategoryWithMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  category: Category
): Promise<(Event & { markets: Market[] })[]> {
  return await db.event.findMany({
    where: { category },
    orderBy: { volume: 'desc' },
    include: {
      markets: {
        orderBy: {
          volume: 'desc'
        }
      }
    }
  })
}

export async function getCategoryStats(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<Array<{
  category: Category;
  categoryName: string;
  eventCount: number;
}>> {
  const result = await db.event.groupBy({
    by: ['category'],
    _count: {
      category: true
    },
    where: {
      category: {
        not: null
      }
    }
  })

  return result.map(row => ({
    category: row.category as Category,
    categoryName: CATEGORY_DISPLAY_NAME[row.category as Category] || 'Unknown',
    eventCount: row._count.category
  })).sort((a, b) => b.eventCount - a.eventCount)
}

export async function getTopEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit = 10
): Promise<Event[]> {
  return await db.event.findMany({
    orderBy: { volume: 'desc' },
    take: limit
  })
}

export async function deleteAllEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<number> {
  const result = await db.event.deleteMany({})
  return result.count
}

export async function upsertEvents(
  db: PrismaClient,
  eventsData: any[]
): Promise<Event[]> {
  if (eventsData.length === 0) {
    return []
  }
  
  // Process in chunks to avoid very large transactions that hurt latency on serverless Postgres
  const results: Event[] = []
  const CHUNK_SIZE = 100
  
  for (let i = 0; i < eventsData.length; i += CHUNK_SIZE) {
    const chunk = eventsData.slice(i, i + CHUNK_SIZE)
    const transactions = chunk.map(event =>
      db.event.upsert({
        where: { id: event.id },
        update: { ...event, updatedAt: new Date() },
        create: event,
      })
    )
    const res = await db.$transaction(transactions)
    results.push(...res)
  }
  
  return results
}

/**
 * Search events by title and description text
 */
export async function searchEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    limit?: number
    includeMarkets?: boolean
  }
): Promise<Array<Event & { markets?: Market[] }>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  
  const events = await db.event.findMany({
    where: {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    include: options?.includeMarkets ? {
      markets: {
        orderBy: { volume: 'desc' },
        take: 5 // Limit markets per event for performance
      }
    } : undefined,
    orderBy: { volume: 'desc' },
    take: limit,
  })
  
  return events
}