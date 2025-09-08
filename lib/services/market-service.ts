import type { PrismaClient, Prisma, Market, Event, Prediction } from '@/lib/generated/prisma'
import { mapMarketToDTO, mapMarketsToDTO } from '@/lib/dtos'
import type { MarketDTO } from '@/lib/types'
import { getMarketStatusFilter, isMarketOpenForBetting } from '@/lib/utils/market-status'
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
 * Applies business filters to show relevant, active events for predictions.
 *
 * Note: Returns events with their best market (one per event) for UI sections.
 */
export async function getTrendingMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  withPredictions = false,
  predictionDaysLookBack = 4,
  tagIds?: string[]
): Promise<any[]> {
  const filterDate = new Date(Date.now() - predictionDaysLookBack * 24 * 60 * 60 * 1000)

  const marketWhereClause: any = {
    closed: false,
    updatedAt: { gte: filterDate },
  }

  if (tagIds && tagIds.length > 0) {
    marketWhereClause.event = {
      eventTags: {
        some: { tagId: { in: tagIds } },
      },
    }
  } else {
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
        take: 1,
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

  // Filter out markets that are no longer open for betting (handles cases where database closed field is stale)
  const markets = marketsFromDb.filter(market => 
    isMarketOpenForBetting({
      closed: market.closed,
      active: market.active,
      closedTime: market.closedTime,
      endDate: market.endDate,
    })
  )

  const eventMarketsMap = new Map<string, any[]>()
  for (const market of markets) {
    const eventId = market.event.id
    if (!eventMarketsMap.has(eventId)) eventMarketsMap.set(eventId, [])
    eventMarketsMap.get(eventId)!.push(market)
  }

  const eventsWithBestMarket = Array.from(eventMarketsMap.entries())
    .map(([_, eventMarkets]) => {
      if (!eventMarkets || eventMarkets.length === 0) return null
      const event = eventMarkets[0].event

      const marketsWithPredictions = eventMarkets.filter((m: any) => m.predictions && m.predictions.length > 0)
      const marketsWithoutPredictions = eventMarkets.filter((m: any) => !m.predictions || m.predictions.length === 0)

      let bestMarket: any = null
      if (marketsWithPredictions.length > 0) {
        const marketsWithDelta = marketsWithPredictions.map((m: any) => {
          const prediction = m.predictions[0]
          const marketProb = Array.isArray(m.outcomePrices)
            ? m.outcomePrices[0]
            : typeof m.outcomePrices === 'string'
              ? JSON.parse(m.outcomePrices)[0]
              : 0.5
          const predictionProb = Array.isArray(prediction.outcomesProbabilities)
            ? prediction.outcomesProbabilities[0]
            : typeof prediction.outcomesProbabilities === 'string'
              ? JSON.parse(prediction.outcomesProbabilities)[0]
              : 0.5
          const delta = Math.abs(marketProb - predictionProb)
          return { ...m, delta, hasPrediction: true }
        })

        const significantDeltaMarkets = marketsWithDelta.filter((m: any) => m.delta > 0.009)
        if (significantDeltaMarkets.length > 0) {
          bestMarket = significantDeltaMarkets.sort((a: any, b: any) => b.delta - a.delta)[0]
        } else {
          bestMarket = marketsWithDelta.sort((a: any, b: any) => parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0'))[0]
          bestMarket.hasPrediction = true
        }
      }

      if (!bestMarket && marketsWithoutPredictions.length > 0) {
        bestMarket = marketsWithoutPredictions.sort((a: any, b: any) => parseFloat(b.volume?.toString() || '0') - parseFloat(a.volume?.toString() || '0'))[0]
        bestMarket.hasPrediction = false
      }

      if (!bestMarket) {
        bestMarket = eventMarkets[0]
        bestMarket.hasPrediction = marketsWithPredictions.includes(bestMarket)
      }

      return { ...event, markets: [bestMarket] }
    })
    .filter((e: any) => e !== null)

  const sortedEvents = (eventsWithBestMarket as any[]).sort((a: any, b: any) => {
    const aHasPrediction = a.markets[0]?.hasPrediction || false
    const bHasPrediction = b.markets[0]?.hasPrediction || false
    if (aHasPrediction && !bHasPrediction) return -1
    if (!aHasPrediction && bHasPrediction) return 1
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
 * Matches on:
 * - market.question
 * - market.description
 * - event.title
 * - event.description
 * - event → tags.label
 * Returns markets with the related event included for UI context.
 */
export async function searchMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    limit?: number
    onlyActive?: boolean
    orderBy?: 'volume' | 'liquidity' | 'updatedAt' // legacy param (mapped from sort)
    sort?: 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending' | 'competitive'
    status?: 'active' | 'resolved' | 'all'
    cursorId?: string | null
  }
): Promise<{ items: Array<Market & { event: Event | null, predictions: Prediction[] }>; nextCursor: string | null }> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  const sort = options?.sort ?? 'trending'
  const status = options?.status ?? (options?.onlyActive ? 'active' : 'all')
  const orderKeyFromSort: 'volume' | 'liquidity' | 'updatedAt' | 'endDate' =
    sort === 'liquidity' ? 'liquidity'
    : sort === 'newest' ? 'updatedAt'
    : sort === 'ending' ? 'endDate'
    : 'volume' // trending and volume both map to volume for now
  const orderKey = options?.orderBy ?? orderKeyFromSort
  const cursorId = options?.cursorId ?? null

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

  // Status filter using reliable market.closed field
  const statusFilter = getMarketStatusFilter(status)
  Object.assign(where, statusFilter)
  
  // For "ending" sort it is sensible to constrain to active (open for betting)
  if (sort === 'ending') {
    where.closed = false
  }

  if (sort === 'competitive') {
    // Best-effort: fetch a larger slice, compute closeness to 0.5, then slice
    const baseRows = await db.market.findMany({
      where,
      include: { 
        event: true,
        predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: Math.min(limit * 5, 200),
    })

    const scored = baseRows
      .map((m) => {
        const p0Raw = Array.isArray((m as any).outcomePrices) ? (m as any).outcomePrices[0] : null
        const p0 = typeof p0Raw === 'number' ? p0Raw : (p0Raw && typeof (p0Raw as any).toNumber === 'function' ? Number((p0Raw as any).toNumber()) : Number(p0Raw))
        const prob = Number.isFinite(p0) ? (p0 as number) : null
        const distance = prob != null ? Math.abs(0.5 - (prob > 1 ? prob / 100 : prob)) : Number.POSITIVE_INFINITY
        return { m, distance }
      })
      .sort((a, b) => a.distance - b.distance)
      .map(({ m }) => m)
      .slice(0, limit)

    return { items: scored, nextCursor: null }
  }

  const direction = orderKey === 'endDate' ? 'asc' : 'desc'
  const orderBy: Prisma.MarketOrderByWithRelationInput[] = []
  // By default ("trending"), prioritize markets with predictions first
  if (sort === 'trending' || sort === undefined) {
    orderBy.push({ predictions: { _count: 'desc' } } as any)
  }
  orderBy.push({ [orderKey]: direction } as any)
  orderBy.push({ id: 'desc' })

  const rows = await db.market.findMany({
    where,
    include: { 
      event: true,
      predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy,
    take: limit + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
  })

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null

  return { items, nextCursor }
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
