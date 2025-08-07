import { prisma } from "./prisma"
import type { AiModel, Event, Market, Prediction, MarketQueryCache } from '../../lib/generated/prisma';
import { CATEGORIES } from '@/lib/categorize'

export type { AiModel as NewAIModel, Event as NewEvent, Prediction as NewPrediction, Market as NewMarket, MarketQueryCache as NewMarketQueryCache } from '../../lib/generated/prisma';

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
  getEventsByCategory: async (categoryId: number): Promise<Event[]> => {
    return await prisma.event.findMany({
      where: { category: categoryId },
      orderBy: { volume: 'desc' }
    })
  },
  getEventsByCategoryWithMarkets: async (categoryId: number): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      where: { category: categoryId },
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
    categoryId: number;
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
      categoryId: row.category!,
      categoryName: CATEGORIES[row.category as keyof typeof CATEGORIES] || 'Unknown',
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
    const transactions = eventsData.map(event => 
      prisma.event.upsert({
        where: { id: event.id },
        update: { ...event, updatedAt: new Date() },
        create: event
      })
    )
    return await prisma.$transaction(transactions)
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
    const transactions = marketsData.map(market => 
      prisma.market.upsert({
        where: { id: market.id },
        update: { ...market, updatedAt: new Date() },
        create: market
      })
    )
    return await prisma.$transaction(transactions)
  },
}

// Prediction queries
export const predictionQueries = {
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

// Market Query Cache queries
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const marketQueryCacheQueries = {
  getCachedMarketQuery: async (
    marketId: string,
    modelName: string
  ): Promise<MarketQueryCache | null> => {
    const oneHourAgo = new Date(Date.now() - CACHE_DURATION_MS);
    
    return await prisma.marketQueryCache.findFirst({
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
  createMarketQueryCache: async (
    cacheData: any
  ): Promise<MarketQueryCache> => {
    return await prisma.marketQueryCache.create({ data: cacheData })
  }
}