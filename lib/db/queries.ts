import { prisma } from "./prisma"
import { Prisma } from '../../lib/generated/prisma'
import type { AiModel, Event, Market, Prediction, ResearchCache, PredictionCheck, Category, Tag, EventTag } from '../../lib/generated/prisma';
import { CATEGORY_DISPLAY_NAME } from '@/lib/categorize'

export type { AiModel as NewAIModel, Event as NewEvent, Prediction as NewPrediction, Market as NewMarket, ResearchCache as NewResearchCache, PredictionCheck as NewPredictionCheck } from '../../lib/generated/prisma';

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

// AI Model queries
export const aiModelQueries = {
  getAllAIModels: async (): Promise<AiModel[]> => {
    return await prisma.aiModel.findMany({
      orderBy: { updatedAt: 'desc' }
    })
  },
  getAIModelById: async (id: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findUnique({
      where: { id }
    })
  },
  getAIModelBySlug: async (slug: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findFirst({
      where: { canonicalSlug: slug }
    })
  },
  createAIModel: async (modelData: any): Promise<AiModel> => {
    return await prisma.aiModel.create({ data: modelData })
  },
  updateAIModel: async (id: string, modelData: Partial<any>): Promise<AiModel | null> => {
    return await prisma.aiModel.update({
      where: { id },
      data: { ...modelData, updatedAt: new Date() }
    })
  },
  deleteAIModel: async (id: string): Promise<boolean> => {
    const result = await prisma.aiModel.delete({ where: { id } })
    return !!result
  },
  upsertAIModels: async (models: any[]): Promise<AiModel[]> => {
    if (models.length === 0) return []
    
    const transactions = models.map(model => 
      prisma.aiModel.upsert({
        where: { id: model.id },
        update: { ...model, updatedAt: new Date() },
        create: model
      })
    )
    
    return await prisma.$transaction(transactions)
  }
}

// Event queries
export const eventQueries = {
  getTrendingEvents: async (): Promise<Event[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10
    })
  },
  getTrendingEventsWithMarkets: async (): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10,
      include: {
        markets: {
          orderBy: {
            volume: 'desc'
          }
        }
      }
    })
  },
  getEventById: async (id: string): Promise<Event | null> => {
    return await prisma.event.findUnique({
      where: { id }
    })
  },
  getEventBySlug: async (slug: string): Promise<Event | null> => {
    return await prisma.event.findFirst({
      where: { slug }
    })
  },
  createEvent: async (eventData: any): Promise<Event> => {
    return await prisma.event.create({ data: eventData })
  },
  updateEvent: async (id: string, eventData: Partial<any>): Promise<Event | null> => {
    return await prisma.event.update({
      where: { id },
      data: { ...eventData, updatedAt: new Date() }
    })
  },
  deleteEvent: async (id: string): Promise<boolean> => {
    const result = await prisma.event.delete({ where: { id } })
    return !!result
  },
  getEventsByCategory: async (category: Category): Promise<Event[]> => {
    return await prisma.event.findMany({
      where: { category },
      orderBy: { volume: 'desc' }
    })
  },
  getEventsByCategoryWithMarkets: async (category: Category): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
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
  },
  getCategoryStats: async (): Promise<Array<{
    category: Category;
    categoryName: string;
    eventCount: number;
  }>> => {
    const result = await prisma.event.groupBy({
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
  },
  getTopEvents: async (limit = 10) => {
    return await prisma.event.findMany({
        orderBy: { volume: 'desc' },
        take: limit
    });
  },
  deleteAllEvents: async () => {
    const result = await prisma.event.deleteMany({})
    return result.count
  },
  upsertEvents: async (eventsData: any[]) => {
    if (eventsData.length === 0) {
      return [];
    }
    // Process in chunks to avoid very large transactions that hurt latency on serverless Postgres
    const results: Event[] = [] as unknown as Event[]
    const CHUNK_SIZE = 100
    for (let i = 0; i < eventsData.length; i += CHUNK_SIZE) {
      const chunk = eventsData.slice(i, i + CHUNK_SIZE)
      const transactions = chunk.map(event =>
        prisma.event.upsert({
          where: { id: event.id },
          update: { ...event, updatedAt: new Date() },
          create: event,
        })
      )
      const res = await prisma.$transaction(transactions)
      results.push(...(res as unknown as Event[]))
    }
    return results
  },
}

// Tag queries
export const tagQueries = {
  getAllTags: async (): Promise<Tag[]> => {
    return await prisma.tag.findMany({
      orderBy: { label: 'asc' }
    })
  },
  getTagsByEventId: async (eventId: string): Promise<Tag[]> => {
    const rows = await prisma.eventTag.findMany({
      where: { eventId },
      include: { tag: true }
    })
    return rows.map(r => r.tag)
  },
  upsertTags: async (tags: Array<{
    id: string
    label: string
    slug?: string | null
    forceShow?: boolean | null
    providerUpdatedAt?: Date | null
    provider?: string | null
  }>): Promise<Tag[]> => {
    if (!tags || tags.length === 0) return []
    const transactions = tags.map(t => prisma.tag.upsert({
      where: { id: t.id },
      update: {
        label: t.label,
        slug: t.slug ?? null,
        forceShow: t.forceShow ?? null,
        providerUpdatedAt: t.providerUpdatedAt ?? null,
        provider: t.provider ?? null,
      },
      create: {
        id: t.id,
        label: t.label,
        slug: t.slug ?? null,
        forceShow: t.forceShow ?? null,
        providerUpdatedAt: t.providerUpdatedAt ?? null,
        provider: t.provider ?? null,
      }
    }))
    return await prisma.$transaction(transactions)
  },
  linkTagsToEvents: async (links: Array<{ eventId: string; tagId: string }>): Promise<number> => {
    if (!links || links.length === 0) return 0
    const result = await prisma.eventTag.createMany({
      data: links,
      skipDuplicates: true,
    })
    return result.count
  },
  unlinkAllTagsFromEvent: async (eventId: string): Promise<number> => {
    const res = await prisma.eventTag.deleteMany({ where: { eventId } })
    return res.count
  },
  // Delete all event-tag links for a set of events with a single statement
  unlinkAllTagsFromEvents: async (eventIds: string[]): Promise<number> => {
    if (!eventIds || eventIds.length === 0) return 0
    const res = await prisma.eventTag.deleteMany({ where: { eventId: { in: eventIds } } })
    return res.count
  },
}

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
  getHighVolumeMarkets: async (limit: number = 20): Promise<Market[]> => {
    return await prisma.market.findMany({
      where: { volume: { gt: 10000 } },
      orderBy: { volume: 'desc' },
      take: limit
    })
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
  searchMarkets: async (
    searchTerm: string,
    options?: {
      limit?: number
      onlyActive?: boolean
      orderBy?: 'volume' | 'liquidity' | 'updatedAt'
      cursorId?: string | null
    }
  ): Promise<{ items: Array<Market & { event: Event | null }>; nextCursor: string | null }> => {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
    const onlyActive = options?.onlyActive ?? true
    const orderKey = options?.orderBy ?? 'volume'
    const cursorId = options?.cursorId ?? null

    const where: Prisma.MarketWhereInput = {
      ...(onlyActive ? { active: true } : {}),
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

    const orderBy: Prisma.MarketOrderByWithRelationInput[] = [
      { [orderKey]: 'desc' } as any,
      { id: 'desc' },
    ]

    const rows = await prisma.market.findMany({
      where,
      include: { event: true },
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

// Prediction queries
export const predictionQueries = {
  getPredictionWithRelationsById: async (id: number): Promise<(Prediction & { market: (Market & { event: Event | null }) | null }) | null> => {
    return await prisma.prediction.findUnique({
      where: { id },
      include: {
        market: {
          include: {
            event: true,
          },
        },
      },
    })
  },
  getPredictionsByMarketId: async (marketId: string): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' }
    })
  },
  getPredictionById: async (id: number): Promise<Prediction | null> => {
    return await prisma.prediction.findUnique({
      where: { id }
    })
  },
  getRecentPredictions: async (limit: number = 50): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
  /**
   * Fetches the most recent predictions including their related market and event
   * to support UI components that need contextual information.
   */
  getRecentPredictionsWithRelations: async (
    limit: number = 20
  ): Promise<Array<Prediction & { market: (Market & { event: Event | null }) | null }>> => {
    return await prisma.prediction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        market: {
          include: {
            event: true,
          },
        },
      },
    })
  },
  createPrediction: async (predictionData: any): Promise<Prediction> => {
    return await prisma.prediction.create({ data: predictionData })
  },
  updatePrediction: async (id: number, predictionData: Partial<any>): Promise<Prediction | null> => {
    return await prisma.prediction.update({
      where: { id },
      data: predictionData
    })
  },
  deletePrediction: async (id: number): Promise<boolean> => {
    const result = await prisma.prediction.delete({ where: { id } })
    return !!result
  },
  getPredictionsByUserMessage: async (userMessage: string): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      where: { userMessage },
      orderBy: { createdAt: 'desc' }
    })
  },
  storePredictionResult: async (
    marketId: string,
    userMessage: string,
    predictionResult: any,
    aiResponse?: string
  ): Promise<Prediction> => {
    const predictionData = {
      marketId,
      userMessage,
      predictionResult,
      aiResponse
    }
    
    const result = await predictionQueries.createPrediction(predictionData)
    if (!result) {
      throw new Error("Failed to create prediction")
    }
    return result
  },
  getMostRecentPredictionByMarketId: async (marketId: string): Promise<Prediction | null> => {
    return await prisma.prediction.findFirst({
      where: { marketId },
      orderBy: { createdAt: 'desc' }
    })
  },
  deleteAllPredictions: async () => {
    const result = await prisma.prediction.deleteMany({})
    return result.count
  },
  getPredictionByMarketId: async (marketId: string) => {
    return await prisma.prediction.findFirst({
        where: { marketId }
    });
  },
  searchPredictionsByUserMessage: async (searchTerm: string, limit = 5) => {
    return await prisma.prediction.findMany({
      where: {
        userMessage: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
}

// Research Cache queries
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const researchCacheQueries = {
  getCachedResearch: async (
    marketId: string,
    modelName: string
  ): Promise<ResearchCache | null> => {
    const oneHourAgo = new Date(Date.now() - CACHE_DURATION_MS);
    
    return await prisma.researchCache.findFirst({
      where: {
        marketId,
        modelName,
        createdAt: {
          gte: oneHourAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  createResearchCache: async (
    cacheData: any
  ): Promise<ResearchCache> => {
    return await prisma.researchCache.create({ data: cacheData })
  }
}

// Prediction Check queries
export const predictionCheckQueries = {
  create: async (data: {
    predictionId?: number | null
    marketId?: string | null
    aiProbability?: number | Prisma.Decimal | null
    marketProbability?: number | Prisma.Decimal | null
    delta?: number | Prisma.Decimal | null
    absDelta?: number | Prisma.Decimal | null
    marketClosed?: boolean | null
  }): Promise<PredictionCheck> => {
    // Normalize to Prisma.Decimal where provided
    const toDecimal = (v: number | Prisma.Decimal | null | undefined): Prisma.Decimal | null => {
      if (v === null || v === undefined) return null
      return typeof v === 'number' ? new Prisma.Decimal(v) : v
    }

    return await prisma.predictionCheck.create({
      data: {
        predictionId: data.predictionId ?? null,
        marketId: data.marketId ?? null,
        aiProbability: toDecimal(data.aiProbability),
        marketProbability: toDecimal(data.marketProbability),
        delta: toDecimal(data.delta),
        absDelta: toDecimal(data.absDelta),
        marketClosed: data.marketClosed ?? null,
      },
    })
  },
  getRecentByMarket: async (marketId: string, limit = 50): Promise<PredictionCheck[]> => {
    return await prisma.predictionCheck.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
}