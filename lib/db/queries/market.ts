import { prisma } from "../prisma"
import { Prisma } from '../../../lib/generated/prisma'
import type { Market, Event, Prediction } from '../../../lib/generated/prisma';
import { serializeDecimals } from "@/lib/serialization"
import type { MarketDTO } from "@/lib/types"
import { Category } from "@/lib/generated/prisma"

// Market queries
export const marketQueries = {
  getMarketsByEventId: async (eventId: string): Promise<Market[]> => {
    return await prisma.market.findMany({
      where: { eventId },
      orderBy: { volume: 'desc' }
    })
  },
  getMarketById: async (id: string): Promise<Market | null> => {
    return await prisma.market.findUnique({
      where: { id }
    })
  },
  /** Serialized wrappers returning DTO-safe shapes */
  getMarketByIdSerialized: async (id: string): Promise<MarketDTO | null> => {
    const m = await marketQueries.getMarketById(id)
    if (!m) return null
    const s = serializeDecimals(m) as any
    return {
      id: s.id,
      question: s.question,
      eventId: s.eventId,
      outcomePrices: s.outcomePrices ?? [],
      volume: s.volume ?? null,
      liquidity: s.liquidity ?? null,
      description: s.description ?? null,
      active: s.active ?? null,
      closed: s.closed ?? null,
      endDate: s.endDate ?? null,
      updatedAt: s.updatedAt ?? null,
      slug: s.slug ?? null,
      startDate: s.startDate ?? null,
      resolutionSource: s.resolutionSource ?? null,
      outcomes: s.outcomes ?? [],
      icon: s.icon ?? null,
      image: s.image ?? null,
    }
  },
  getHighVolumeMarkets: async (limit: number = 20): Promise<Market[]> => {
    return await prisma.market.findMany({
      where: { volume: { gt: 10000 } },
      orderBy: { volume: 'desc' },
      take: limit
    })
  },
  getMarketsByEventIdSerialized: async (eventId: string): Promise<MarketDTO[]> => {
    const rows = await marketQueries.getMarketsByEventId(eventId)
    const s = serializeDecimals(rows) as any[]
    return s.map((m) => ({
      id: m.id,
      question: m.question,
      eventId: m.eventId,
      outcomePrices: m.outcomePrices ?? [],
      volume: m.volume ?? null,
      liquidity: m.liquidity ?? null,
      description: m.description ?? null,
      active: m.active ?? null,
      closed: m.closed ?? null,
      endDate: m.endDate ?? null,
      updatedAt: m.updatedAt ?? null,
      slug: m.slug ?? null,
      startDate: m.startDate ?? null,
      resolutionSource: m.resolutionSource ?? null,
      outcomes: m.outcomes ?? [],
      icon: m.icon ?? null,
      image: m.image ?? null,
    }))
  },
  createMarket: async (marketData: any): Promise<Market> => {
    const marketWithId = {
      ...marketData,
      id: marketData.id || crypto.randomUUID()
    }
    if (!marketWithId.eventId) {
      throw new Error('eventId is required when creating a market')
    }
    return await prisma.market.create({ data: marketWithId })
  },
  updateMarket: async (id: string, marketData: Partial<any>): Promise<Market | null> => {
    return await prisma.market.update({
      where: { id },
      data: { ...marketData, updatedAt: new Date() }
    })
  },
  deleteMarket: async (id: string): Promise<boolean> => {
    const result = await prisma.market.delete({ where: { id } })
    return !!result
  },
  updateMarketVolume: async (id: string, newVolume: number): Promise<Market | null> => {
    return await prisma.market.update({
      where: { id },
      data: { volume: newVolume, updatedAt: new Date() }
    })
  },
  getTopMarkets: async (limit = 10) => {
    return await prisma.market.findMany({
        orderBy: { volume: 'desc' },
        take: limit
    });
  },
  deleteAllMarkets: async () => {
    const result = await prisma.market.deleteMany({})
    return result.count
  },
  upsertMarkets: async (marketsData: any[]) => {
    if (marketsData.length === 0) {
      return [];
    }
    // Process in chunks to reduce lock time and round trips
    const results: Market[] = [] as unknown as Market[]
    const CHUNK_SIZE = 100
    for (let i = 0; i < marketsData.length; i += CHUNK_SIZE) {
      const chunk = marketsData.slice(i, i + CHUNK_SIZE)
      const transactions = chunk.map(market =>
        prisma.market.upsert({
          where: { id: market.id },
          update: { ...market, updatedAt: new Date() },
          create: market,
        })
      )
      const res = await prisma.$transaction(transactions)
      results.push(...(res as unknown as Market[]))
    }
    return results
  },
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
  /**
   * Get top markets by volume whose events end within a specified time range
   */
  getMarketsByVolumeAndEndDate: async (
    rangeStart: Date,
    rangeEnd: Date,
    topMarketsCount: number = 10,
    categoryMix: boolean = false,
    excludeCategories?: Category[]
  ) => {
    if (categoryMix) {
      const query = {
        where: {
          event: {
            endDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
        },
        orderBy: { volume: 'desc' } as const,
        include: {
          event: {
            select: { category: true, endDate: true },
          },
        },
      }
      
      const marketsInRange = await prisma.market.findMany(query)
      return marketsInRange
    }

    // Otherwise: Query the top markets by volume in the range
    const whereClause: {
      event: {
        endDate: {
          gte: Date;
          lte: Date;
        };
        category?: {
          notIn: Category[];
        };
      };
    } = {
      event: {
        endDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    }

    if (excludeCategories && excludeCategories.length > 0) {
      whereClause.event = {
        endDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        category: { notIn: excludeCategories },
      }
    }

    return await prisma.market.findMany({
      where: whereClause,
      orderBy: { volume: 'desc' },
      take: topMarketsCount,
      select: {
        id: true,
        question: true,
        volume: true,
        event: {
          select: {
            endDate: true,
          },
        },
      },
    })
  },
  
  searchMarkets: async (
    searchTerm: string,
    options?: {
      limit?: number
      onlyActive?: boolean
      orderBy?: 'volume' | 'liquidity' | 'updatedAt' // legacy param (mapped from sort)
      sort?: 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending' | 'competitive'
      status?: 'active' | 'resolved' | 'all'
      cursorId?: string | null
    }
  ): Promise<{ items: Array<Market & { event: Event | null, predictions: Prediction[] }>; nextCursor: string | null }> => {
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

    // Status filter
    if (status === 'active') {
      where.active = true
    } else if (status === 'resolved') {
      // Prefer explicit closed flag if available
      where.closed = true
    }
    // For "ending" sort it is sensible to constrain to active
    if (sort === 'ending') {
      where.active = true
    }

    if (sort === 'competitive') {
      // Best-effort: fetch a larger slice, compute closeness to 0.5, then slice
      const baseRows = await prisma.market.findMany({
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

    const rows = await prisma.market.findMany({
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
  },
}