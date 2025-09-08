import type { PrismaClient, Prisma, Market, Event, Prediction } from '@/lib/generated/prisma'
import { mapMarketToDTO, mapMarketsToDTO } from '@/lib/dtos'
import type { MarketDTO } from '@/lib/types'
import { getMarketStatusFilter, getOpenMarketsDatabaseFilter } from '@/lib/utils/market-status'
import { tagFilter } from '@/lib/constants/filters'

/**
 * Market service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs (never raw Prisma models)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getMarketsByEventId(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventId: string
): Promise<Market[]> {
  return await db.market.findMany({
    where: { eventId },
    orderBy: { volume: 'desc' }
  })
}

export async function getMarketById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<Market | null> {
  return await db.market.findUnique({
    where: { id }
  })
}

export async function getMarketByIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<MarketDTO | null> {
  const market = await getMarketById(db, id)
  if (!market) return null
  return mapMarketToDTO(market)
}

export async function getHighVolumeMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit: number = 20
): Promise<Market[]> {
  return await db.market.findMany({
    where: { volume: { gt: 10000 } },
    orderBy: { volume: 'desc' },
    take: limit
  })
}

export async function getMarketsByEventIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventId: string
): Promise<MarketDTO[]> {
  const markets = await getMarketsByEventId(db, eventId)
  return mapMarketsToDTO(markets)
}

/**
 * Gets trending events with their associated markets, sorted by prediction status then volume.
 * 
 * FILTERING:
 * - Returns BOTH markets with and without predictions
 * - Only includes open markets (closed: false)
 * - Only includes recently updated markets (within predictionDaysLookBack days)
 * - Applies tag filtering if specified
 * 
 * SORTING:
 * - Markets WITH predictions are shown FIRST
 * - Markets WITHOUT predictions are shown SECOND
 * - Within each group, sorted by highest volume
 * 
 * SELECTION (per event):
 * - Returns ONE best market per event
 * - Prefers markets with significant prediction delta (>0.9% difference)
 * - Falls back to highest volume market
 * 
 * @param predictionDaysLookBack - How many days of recent activity to consider (default: 4)
 * @param tagIds - Optional tag filter to restrict to specific categories
 */
export async function getTrendingMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  predictionDaysLookBack = 4,
  tagIds?: string[]
): Promise<any[]> {
  const filterDate = new Date(Date.now() - predictionDaysLookBack * 24 * 60 * 60 * 1000)

  // Build WHERE clause for active markets updated recently
  const marketWhereClause: any = {
    ...getOpenMarketsDatabaseFilter(),
    updatedAt: { gte: filterDate },
  }

  // Apply tag filtering - either include specified tags or exclude filtered tags
  if (tagIds && tagIds.length > 0) {
    marketWhereClause.event = {
      eventTags: {
        some: { tagId: { in: tagIds } },
      },
    }
  } else {
    // Exclude markets with filtered tags (e.g. adult content)
    marketWhereClause.event = {
      NOT: {
        eventTags: {
          some: {
            tag: { label: { in: tagFilter, mode: 'insensitive' as any } },
          },
        },
      },
    }
  }

  // Fetch top 100 markets by volume with their events and recent predictions
  const marketsFromDb = await db.market.findMany({
    where: marketWhereClause,
    orderBy: { volume: 'desc' },
    take: 100,
    include: {
      event: {
        include: {
          eventTags: {
            include: {
              tag: { select: { id: true, label: true, slug: true, forceShow: true } },
            },
          },
        },
      },
      predictions: {
        where: { createdAt: { gte: filterDate } },
        orderBy: { createdAt: 'desc' },
        take: 1, // Only need latest prediction per market
        select: {
          id: true,
          outcomes: true,
          outcomesProbabilities: true,
          createdAt: true,
          modelName: true,
          predictionResult: true,
        },
      },
    },
  })

  // Database query already filtered for truly open markets
  const markets = marketsFromDb

  // Group markets by event ID
  const eventMarketsMap = new Map<string, any[]>()
  for (const market of markets) {
    const eventId = market.event.id
    if (!eventMarketsMap.has(eventId)) eventMarketsMap.set(eventId, [])
    eventMarketsMap.get(eventId)!.push(market)
  }

  // Select the best market for each event
  const eventsWithBestMarket = Array.from(eventMarketsMap.entries())
    .map(([_, eventMarkets]) => {
      if (!eventMarkets || eventMarkets.length === 0) return null
      const event = eventMarkets[0].event

      // Separate markets with/without predictions
      const marketsWithPredictions = eventMarkets.filter((m: any) => m.predictions && m.predictions.length > 0)
      const marketsWithoutPredictions = eventMarkets.filter((m: any) => !m.predictions || m.predictions.length === 0)

      let bestMarket: any = null
      
      // Prioritize markets with predictions
      if (marketsWithPredictions.length > 0) {
        // Calculate delta (difference between market and AI prediction)
        const marketsWithDelta = marketsWithPredictions.map((m: any) => {
          const prediction = m.predictions[0]
          
          // Extract market probability (handle various data formats)
          const marketProb = Array.isArray(m.outcomePrices)
            ? m.outcomePrices[0]
            : typeof m.outcomePrices === 'string'
              ? JSON.parse(m.outcomePrices)[0]
              : 0.5
              
          // Extract prediction probability
          const predictionProb = Array.isArray(prediction.outcomesProbabilities)
            ? prediction.outcomesProbabilities[0]
            : typeof prediction.outcomesProbabilities === 'string'
              ? JSON.parse(prediction.outcomesProbabilities)[0]
              : 0.5
              
          const delta = Math.abs(marketProb - predictionProb)
          return { ...m, delta, hasPrediction: true }
        })

        // Prefer markets with significant delta (>0.9% difference)
        const significantDeltaMarkets = marketsWithDelta.filter((m: any) => m.delta > 0.009)
        if (significantDeltaMarkets.length > 0) {
          bestMarket = significantDeltaMarkets.sort((a: any, b: any) => b.delta - a.delta)[0]
        } else {
          // Fall back to highest volume market with prediction
          bestMarket = marketsWithDelta.sort((a: any, b: any) => parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0'))[0]
          bestMarket.hasPrediction = true
        }
      }

      // Fall back to markets without predictions (by volume)
      if (!bestMarket && marketsWithoutPredictions.length > 0) {
        bestMarket = marketsWithoutPredictions.sort((a: any, b: any) => parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0'))[0]
        bestMarket.hasPrediction = false
      }

      // Final fallback: use first market
      if (!bestMarket) {
        bestMarket = eventMarkets[0]
        bestMarket.hasPrediction = marketsWithPredictions.includes(bestMarket)
      }

      return { ...event, markets: [bestMarket] }
    })
    .filter((e: any) => e !== null)

  // Sort events: those with predictions first, then by volume
  // Final order will be:
  //   1. Events with predictions (sorted by volume DESC)
  //   2. Events without predictions (sorted by volume DESC)
  const sortedEvents = (eventsWithBestMarket as any[]).sort((a: any, b: any) => {
    const aHasPrediction = a.markets[0]?.hasPrediction || false
    const bHasPrediction = b.markets[0]?.hasPrediction || false
    
    // Events with predictions come first
    if (aHasPrediction && !bHasPrediction) return -1
    if (!aHasPrediction && bHasPrediction) return 1
    
    // Within same prediction status, sort by volume
    const aVolume = parseFloat(a.volume?.toString() || '0')
    const bVolume = parseFloat(b.volume?.toString() || '0')
    return bVolume - aVolume
  })

  return sortedEvents
}

export async function createMarket(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketData: any
): Promise<Market> {
  const marketWithId = {
    ...marketData,
    id: marketData.id || crypto.randomUUID()
  }
  
  if (!marketWithId.eventId) {
    throw new Error('eventId is required when creating a market')
  }
  
  return await db.market.create({ data: marketWithId })
}

export async function updateMarket(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  marketData: Partial<any>
): Promise<Market | null> {
  return await db.market.update({
    where: { id },
    data: { ...marketData, updatedAt: new Date() }
  })
}

export async function deleteMarket(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<boolean> {
  const result = await db.market.delete({ where: { id } })
  return !!result
}

export async function updateMarketVolume(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  newVolume: number
): Promise<Market | null> {
  return await db.market.update({
    where: { id },
    data: { volume: newVolume, updatedAt: new Date() }
  })
}

export async function getTopMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit = 10
): Promise<Market[]> {
  return await db.market.findMany({
    orderBy: { volume: 'desc' },
    take: limit
  })
}

export async function deleteAllMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<number> {
  const result = await db.market.deleteMany({})
  return result.count
}

export async function upsertMarkets(
  db: PrismaClient,
  marketsData: any[]
): Promise<Market[]> {
  if (marketsData.length === 0) {
    return []
  }
  
  // Process in chunks to reduce lock time and round trips
  const results: Market[] = []
  const CHUNK_SIZE = 100
  
  for (let i = 0; i < marketsData.length; i += CHUNK_SIZE) {
    const chunk = marketsData.slice(i, i + CHUNK_SIZE)
    const transactions = chunk.map(market =>
      db.market.upsert({
        where: { id: market.id },
        update: { ...market, updatedAt: new Date() },
        create: market,
      })
    )
    const res = await db.$transaction(transactions)
    results.push(...res)
  }
  
  return results
}

/**
 * Full‑text style search across markets and their related event/tag data.
 * 
 * Search matches on:
 * - market.question
 * - market.description
 * - event.title
 * - event.description
 * - event → tags.label
 * 
 * @returns Markets with related event and latest prediction for UI context
 * 
 * Sort options:
 * - trending: Markets with predictions first, then by volume
 * - competitive: Markets closest to 50/50 probability (most uncertain)
 * - ending: Markets closing soonest that are still open for betting
 * - volume/liquidity/newest: Standard database sorting
 */
export async function searchMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    limit?: number
    sort?: 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending' | 'competitive'
    status?: 'active' | 'resolved' | 'all'
    cursorId?: string | null
  }
): Promise<{ items: Array<Market & { event: Event | null, predictions: Prediction[] }>; nextCursor: string | null }> {
  // Validate and constrain limit to prevent excessive data fetching
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  const sort = options?.sort ?? 'trending'
  const status = options?.status ?? 'all'
  const cursorId = options?.cursorId ?? null
  
  // Map sort type to database column for ordering
  const getOrderKey = (sortType: string): 'volume' | 'liquidity' | 'updatedAt' | 'endDate' => {
    switch (sortType) {
      case 'liquidity': return 'liquidity'
      case 'newest': return 'updatedAt'
      case 'ending': return 'endDate'
      default: return 'volume' // trending, volume, and competitive use volume as base
    }
  }
  const orderKey = getOrderKey(sort)

  const where: Prisma.MarketWhereInput = {
    OR: [
      { question: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      {
        event: {
          is: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              {
                eventTags: {
                  some: {
                    tag: { label: { contains: searchTerm, mode: 'insensitive' } },
                  },
                },
              },
            ],
          },
        },
      },
    ],
  }

  // Apply status filter to WHERE clause
  const statusFilter = getMarketStatusFilter(status)
  Object.assign(where, statusFilter)
  
  // Handle competitive sorting separately - finds markets closest to 50/50 probability
  if (sort === 'competitive') {
    return handleCompetitiveSorting(db, where, limit)
  }

  // Build ordering strategy based on sort type
  const direction = orderKey === 'endDate' ? 'asc' : 'desc'
  const orderBy: Prisma.MarketOrderByWithRelationInput[] = []
  
  // For trending sort, prioritize markets that have AI predictions
  if (sort === 'trending') {
    orderBy.push({ predictions: { _count: 'desc' } } as any)
  }
  
  // Add primary sort column and stable secondary sort by ID
  orderBy.push({ [orderKey]: direction } as any)
  orderBy.push({ id: 'desc' }) // Ensures consistent pagination

  // Fetch data with appropriate limits for post-processing filters
  const fetchLimit = sort === 'ending' 
    ? (limit + 1) * 2  // Fetch extra for ending sort as we filter out closed markets
    : limit + 1        // Standard limit + 1 for pagination detection
    
  const rows = await db.market.findMany({
    where,
    include: { 
      event: true,
      predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy,
    take: fetchLimit,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
  })

  // For ending sort, we already applied the filter in the database query via getMarketStatusFilter
  // No additional JavaScript filtering needed
  let filteredRows = rows

  // Handle pagination
  const hasMore = filteredRows.length > limit
  const items = hasMore ? filteredRows.slice(0, limit) : filteredRows
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null

  return { items, nextCursor }
}

/**
 * Helper function for competitive sorting - finds markets closest to 50/50 probability
 * These are the most uncertain/competitive markets where predictions could add the most value
 */
async function handleCompetitiveSorting(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  where: Prisma.MarketWhereInput,
  limit: number
): Promise<{ items: Array<Market & { event: Event | null, predictions: Prediction[] }>; nextCursor: string | null }> {
  // Fetch more markets than needed to find the most competitive ones
  const baseRows = await db.market.findMany({
    where,
    include: { 
      event: true,
      predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: Math.min(limit * 5, 200), // Fetch 5x limit up to 200 max
  })

  // Calculate distance from 50% probability for each market
  const scored = baseRows
    .map((market) => {
      // Extract first outcome price (handles various data formats)
      const p0Raw = Array.isArray((market as any).outcomePrices) 
        ? (market as any).outcomePrices[0] 
        : null
        
      // Convert to number (handles Decimal type from Prisma)
      const p0 = typeof p0Raw === 'number' 
        ? p0Raw 
        : (p0Raw && typeof (p0Raw as any).toNumber === 'function' 
          ? Number((p0Raw as any).toNumber()) 
          : Number(p0Raw))
          
      // Normalize probability (handle both 0-1 and 0-100 ranges)
      const prob = Number.isFinite(p0) 
        ? (p0 > 1 ? p0 / 100 : p0) as number
        : null
        
      // Calculate distance from 50% (most uncertain)
      const distance = prob != null 
        ? Math.abs(0.5 - prob) 
        : Number.POSITIVE_INFINITY // Markets without prices go last
        
      return { market, distance }
    })
    .sort((a, b) => a.distance - b.distance) // Sort by closest to 50%
    .map(({ market }) => market)
    .slice(0, limit)

  return { items: scored, nextCursor: null } // No pagination for competitive sort
}

export async function refreshMarketFromPolymarket(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<MarketDTO | null> {
  try {
    console.log(`Refreshing market data for market ${marketId}`)
    
    // First check if market exists in our database to get eventId
    const existingMarket = await db.market.findUnique({
      where: { id: marketId },
      select: { eventId: true }
    })
    
    if (!existingMarket) {
      console.warn(`Market ${marketId} not found in database - cannot refresh without eventId`)
      return null
    }
    
    // Dynamic imports to avoid bundling in client
    const [
      { fetchPolymarketMarket }, 
      { transformMarketToDbFormat }
    ] = await Promise.all([
      import('./polymarket-client').then(m => ({ fetchPolymarketMarket: m.fetchPolymarketMarket })),
      import('./polymarket-batch-processor').then(m => ({ transformMarketToDbFormat: m.transformMarketToDbFormat }))
    ])
    
    // Fetch fresh data from Polymarket
    const polymarketData = await fetchPolymarketMarket(marketId)
    
    if (!polymarketData) {
      console.warn(`No data found for market ${marketId} from Polymarket`)
      return null
    }
    
    // Add eventId from existing market to polymarket data
    const polymarketDataWithEventId = {
      ...polymarketData,
      eventId: existingMarket.eventId
    }
    
    // Transform to database format
    const rawMarketData = transformMarketToDbFormat(polymarketDataWithEventId)
    
    // Filter out null values (Prisma doesn't accept null in upserts)
    const marketData = Object.entries(rawMarketData).reduce((acc, [key, value]) => {
      if (value !== null) {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    // Clean up data for Prisma update by removing fields that shouldn't be updated
    const { id, eventId, ...updateData } = marketData
    
    // Update the market in database (no create since we're only refreshing existing markets)
    const updatedMarket = await db.market.update({
      where: { id: marketId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })
    
    console.log(`Successfully refreshed market ${marketId}`)
    return mapMarketToDTO(updatedMarket)
  } catch (error) {
    console.error(`Failed to refresh market ${marketId}:`, error)
    throw new Error(`Failed to refresh market data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
