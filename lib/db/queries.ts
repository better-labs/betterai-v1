import { db } from "./index"
import { events, markets, predictions, aiModels, marketQueryCache } from "./schema"
import { eq, desc, sql, gt, and, gte } from "drizzle-orm"
import type { AIModel, NewAIModel, Event, Market, NewEvent, Prediction, NewPrediction, PredictionResult, MarketQueryCache, NewMarketQueryCache } from '@/lib/types'
import { CATEGORIES } from '@/lib/categorize'

export type NewMarket = typeof markets.$inferInsert
export type { NewAIModel, NewEvent, NewPrediction, NewMarketQueryCache }

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

// AI Model queries
export const aiModelQueries = {
  getAllAIModels: async (): Promise<AIModel[]> => {
    return await db.query.aiModels.findMany({
      orderBy: (aiModels, { desc }) => [desc(aiModels.updatedAt)]
    })
  },
  getAIModelById: async (id: string): Promise<AIModel | null> => {
    const result = await db.query.aiModels.findFirst({
      where: (aiModels, { eq }) => eq(aiModels.id, id)
    })
    return result || null
  },
  getAIModelBySlug: async (slug: string): Promise<AIModel | null> => {
    const result = await db.query.aiModels.findFirst({
      where: (aiModels, { eq }) => eq(aiModels.canonicalSlug, slug)
    })
    return result || null
  },
  createAIModel: async (modelData: NewAIModel): Promise<AIModel> => {
    const [result] = await db.insert(aiModels).values(modelData).returning()
    return result
  },
  updateAIModel: async (id: string, modelData: Partial<NewAIModel>): Promise<AIModel | null> => {
    const [result] = await db
      .update(aiModels)
      .set({ ...modelData, updatedAt: new Date() })
      .where(eq(aiModels.id, id))
      .returning()
    return result || null
  },
  deleteAIModel: async (id: string): Promise<boolean> => {
    const result = await db.delete(aiModels).where(eq(aiModels.id, id))
    return result.rowCount > 0
  },
  upsertAIModels: async (models: NewAIModel[]): Promise<AIModel[]> => {
    if (models.length === 0) return []
    
    const results = await db
      .insert(aiModels)
      .values(models)
      .onConflictDoUpdate({
        target: aiModels.id,
        set: {
          name: sql`EXCLUDED.name`,
          created: sql`EXCLUDED.created`,
          description: sql`EXCLUDED.description`,
          architecture: sql`EXCLUDED.architecture`,
          topProvider: sql`EXCLUDED.top_provider`,
          pricing: sql`EXCLUDED.pricing`,
          canonicalSlug: sql`EXCLUDED.canonical_slug`,
          contextLength: sql`EXCLUDED.context_length`,
          huggingFaceId: sql`EXCLUDED.hugging_face_id`,
          perRequestLimits: sql`EXCLUDED.per_request_limits`,
          supportedParameters: sql`EXCLUDED.supported_parameters`,
          updatedAt: new Date(),
        }
      })
      .returning()
    
    return results
  }
}

// Event queries
export const eventQueries = {
  getTrendingEvents: async (): Promise<Event[]> => {
    return await db.query.events.findMany({
      orderBy: (events, { desc }) => [desc(events.volume)],
      limit: 10
    })
  },
  getTrendingEventsWithMarkets: async (): Promise<(Event & { markets: Market[] })[]> => {
    // Get trending events first
    const trendingEvents = await db.query.events.findMany({
      orderBy: (events, { desc }) => [desc(events.volume)],
      limit: 10
    })
  
    // Get all markets for these events in a single query
    const eventIds = trendingEvents.map(event => event.id)
    const allMarkets = await db.query.markets.findMany({
      where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
      orderBy: (markets, { desc }) => [desc(markets.volume)]
    })
  
    // Group markets by eventId
    const marketsByEventId = allMarkets.reduce((acc, market) => {
      if (market.eventId) {
        if (!acc[market.eventId]) {
          acc[market.eventId] = []
        }
        acc[market.eventId].push(market)
      }
      return acc
    }, {} as Record<string, Market[]>)
  
    // Combine events with their markets
    return trendingEvents.map(event => ({
      ...event,
      markets: marketsByEventId[event.id] || []
    }))
  },
  getEventById: async (id: string): Promise<Event | null> => {
    const result = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, id)
    })
    return result || null
  },
  getEventBySlug: async (slug: string): Promise<Event | null> => {
    const result = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.slug, slug)
    })
    return result || null
  },
  createEvent: async (eventData: NewEvent): Promise<Event> => {
    const [result] = await db.insert(events).values(eventData).returning()
    return result
  },
  updateEvent: async (id: string, eventData: Partial<NewEvent>): Promise<Event | null> => {
    const [result] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning()
    return result || null
  },
  deleteEvent: async (id: string): Promise<boolean> => {
    const result = await db.delete(events).where(eq(events.id, id))
    return result.rowCount > 0
  },
  getEventsByCategory: async (categoryId: number): Promise<Event[]> => {
    return await db.query.events.findMany({
      where: (events, { eq }) => eq(events.category, categoryId),
      orderBy: (events, { desc }) => [desc(events.volume)]
    })
  },
  getEventsByCategoryWithMarkets: async (categoryId: number): Promise<(Event & { markets: Market[] })[]> => {
    // Get events by category
    const categoryEvents = await db.query.events.findMany({
      where: (events, { eq }) => eq(events.category, categoryId),
      orderBy: (events, { desc }) => [desc(events.volume)]
    })
  
    // Get all markets for these events in a single query
    const eventIds = categoryEvents.map(event => event.id)
    const allMarkets = await db.query.markets.findMany({
      where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
      orderBy: (markets, { desc }) => [desc(markets.volume)]
    })
  
    // Group markets by eventId
    const marketsByEventId = allMarkets.reduce((acc, market) => {
      if (market.eventId) {
        if (!acc[market.eventId]) {
          acc[market.eventId] = []
        }
        acc[market.eventId].push(market)
      }
      return acc
    }, {} as Record<string, Market[]>)
  
    // Combine events with their markets
    return categoryEvents.map(event => ({
      ...event,
      markets: marketsByEventId[event.id] || []
    }))
  },
  getCategoryStats: async (): Promise<Array<{
    categoryId: number;
    categoryName: string;
    eventCount: number;
  }>> => {
    // Get event counts by category
    const result = await db
      .select({
        category: events.category,
        count: sql<number>`count(*)::int`
      })
      .from(events)
      .where(sql`${events.category} IS NOT NULL`)
      .groupBy(events.category)
  
    // Map to include category names
    return result.map(row => ({
      categoryId: row.category!,
      categoryName: CATEGORIES[row.category as keyof typeof CATEGORIES] || 'Unknown',
      eventCount: row.count
    })).sort((a, b) => b.eventCount - a.eventCount)
  },
  // Get all events ordered by volume
  getTopEvents: async (limit = 10) => {
    return await db.select().from(events).orderBy(desc(events.volume)).limit(limit)
  },

  // Delete all events
  deleteAllEvents: async () => {
    try {
      const result = await db.delete(events).returning()
      return result.length
    } catch (error) {
      console.error("Error deleting all events:", error)
      throw error
    }
  },

  // Upsert events
  upsertEvents: async (eventsData: NewEvent[]) => {
    if (eventsData.length === 0) {
      return [];
    }
    try {
      const result = await db
        .insert(events)
        .values(eventsData)
        .onConflictDoUpdate({
          target: events.id,
          set: {
            title: sql`EXCLUDED.title`,
            description: sql`EXCLUDED.description`,
            slug: sql`EXCLUDED.slug`,
            tags: sql`EXCLUDED.tags`,
            volume: sql`EXCLUDED.volume`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error upserting events:", error);
      throw error;
    }
  },
}

// Market queries
export const marketQueries = {
  getMarketsByEventId: async (eventId: string): Promise<Market[]> => {
    return await db.query.markets.findMany({
      where: (markets, { eq }) => eq(markets.eventId, eventId),
      orderBy: (markets, { desc }) => [desc(markets.volume)]
    })
  },
  getMarketById: async (id: string): Promise<Market | null> => {
    const result = await db.query.markets.findFirst({
      where: (markets, { eq }) => eq(markets.id, id)
    })
    return result || null
  },
  getHighVolumeMarkets: async (limit: number = 20): Promise<Market[]> => {
    return await db.query.markets.findMany({
      where: (markets, { gt }) => gt(markets.volume, "10000"),
      orderBy: (markets, { desc }) => [desc(markets.volume)],
      limit
    })
  },
  createMarket: async (marketData: NewMarket): Promise<Market> => {
    // Ensure id is provided for new markets
    const marketWithId = {
      ...marketData,
      id: marketData.id || crypto.randomUUID()
    }
    const [result] = await db.insert(markets).values(marketWithId).returning()
    return result
  },
  updateMarket: async (id: string, marketData: Partial<NewMarket>): Promise<Market | null> => {
    const [result] = await db
      .update(markets)
      .set({ ...marketData, updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning()
    return result || null
  },
  deleteMarket: async (id: string): Promise<boolean> => {
    const result = await db.delete(markets).where(eq(markets.id, id))
    return result.rowCount > 0
  },
  updateMarketVolume: async (id: string, newVolume: number): Promise<Market | null> => {
    const [result] = await db
      .update(markets)
      .set({ volume: newVolume.toString(), updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning()
    return result || null
  },

  // Get top markets by volume
  getTopMarkets: async (limit = 10) => {
    return await db.select().from(markets).orderBy(desc(markets.volume)).limit(limit)
  },

  // Delete all markets
  deleteAllMarkets: async () => {
    try {
      const result = await db.delete(markets).returning()
      return result.length
    } catch (error) {
      console.error("Error deleting all markets:", error)
      throw error
    }
  },

  // Upsert markets
  upsertMarkets: async (marketsData: NewMarket[]) => {
    if (marketsData.length === 0) {
      return [];
    }
    try {
      const result = await db
        .insert(markets)
        .values(marketsData)
        .onConflictDoUpdate({
          target: markets.id,
          set: {
            question: sql`EXCLUDED.question`,
            eventId: sql`EXCLUDED.event_id`,
            outcomePrices: sql`EXCLUDED.outcome_prices`,
            outcomes: sql`EXCLUDED.outcomes`,
            volume: sql`EXCLUDED.volume`,
            liquidity: sql`EXCLUDED.liquidity`,
            active: sql`EXCLUDED.active`,
            closed: sql`EXCLUDED.closed`,
            resolutionSource: sql`EXCLUDED.resolution_source`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error upserting markets:", error);
      throw error;
    }
  },
}

// Prediction queries
export const predictionQueries = {
  getPredictionsByMarketId: async (marketId: string): Promise<Prediction[]> => {
    return await db.query.predictions.findMany({
      where: (predictions, { eq }) => eq(predictions.marketId, marketId),
      orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
    })
  },
  getPredictionById: async (id: number): Promise<Prediction | null> => {
    const result = await db.query.predictions.findFirst({
      where: (predictions, { eq }) => eq(predictions.id, id)
    })
    return result || null
  },
  getRecentPredictions: async (limit: number = 50): Promise<Prediction[]> => {
    return await db.query.predictions.findMany({
      orderBy: (predictions, { desc }) => [desc(predictions.createdAt)],
      limit
    })
  },
  createPrediction: async (predictionData: NewPrediction): Promise<Prediction> => {
    const [result] = await db.insert(predictions).values(predictionData).returning()
    return result
  },
  updatePrediction: async (id: number, predictionData: Partial<NewPrediction>): Promise<Prediction | null> => {
    const [result] = await db
      .update(predictions)
      .set(predictionData)
      .where(eq(predictions.id, id))
      .returning()
    return result || null
  },
  deletePrediction: async (id: number): Promise<boolean> => {
    const result = await db.delete(predictions).where(eq(predictions.id, id))
    return result.rowCount > 0
  },
  getPredictionsByUserMessage: async (userMessage: string): Promise<Prediction[]> => {
    return await db.query.predictions.findMany({
      where: (predictions, { eq }) => eq(predictions.userMessage, userMessage),
      orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
    })
  },
  storePredictionResult: async (
    marketId: string,
    userMessage: string,
    predictionResult: PredictionResult,
    aiResponse?: string
  ): Promise<Prediction> => {
    const predictionData: NewPrediction = {
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
    const result = await db.query.predictions.findFirst({
      where: (predictions, { eq }) => eq(predictions.marketId, marketId),
      orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
    })
    return result || null
  },
  // Delete all predictions
  deleteAllPredictions: async () => {
    try {
      const result = await db.delete(predictions).returning()
      return result.length
    } catch (error) {
      console.error("Error deleting all predictions:", error)
      throw error
    }
  },

  // Get prediction by market ID
  getPredictionByMarketId: async (marketId: string) => {
    const result = await db.select().from(predictions).where(eq(predictions.marketId, marketId)).limit(1)
    return result[0] || null
  },

  // Search predictions by userMessage
  searchPredictionsByUserMessage: async (searchTerm: string, limit = 5) => {
    return await db
      .select()
      .from(predictions)
      .where(sql`${predictions.userMessage} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
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
    
    const result = await db.query.marketQueryCache.findFirst({
      where: and(
        eq(marketQueryCache.marketId, marketId),
        eq(marketQueryCache.modelName, modelName),
        gte(marketQueryCache.createdAt, oneHourAgo)
      ),
      orderBy: [desc(marketQueryCache.createdAt)]
    });
  
    return result || null;
  },
  createMarketQueryCache: async (
    cacheData: NewMarketQueryCache
  ): Promise<MarketQueryCache> => {
    const [result] = await db.insert(marketQueryCache).values(cacheData).returning()
    return result
  }
}
