import { db } from "./index"
import { events, markets, predictions } from "./schema"
import { eq, desc, sql } from "drizzle-orm"

export type NewPrediction = typeof predictions.$inferInsert
export type NewEvent = typeof events.$inferInsert
export type NewMarket = typeof markets.$inferInsert

// Event queries
export const eventQueries = {
  // Get all events ordered by volume
  getTopEvents: async (limit = 10) => {
    return await db.select().from(events).orderBy(desc(events.volume)).limit(limit)
  },

  // Get all events ordered by trending rank
  getTrendingEventIDs: async (limit = 10) => {
    return await db.select().from(events).orderBy(events.trendingRank).limit(limit)
  },

  // Get event by ID
  getEventById: async (id: string) => {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1)
    return result[0] || null
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
    const results = await Promise.all(
      eventsData.map(async (event) => {
        try {
          const result = await db
            .insert(events)
            .values(event)
            .onConflictDoUpdate({
              target: events.id,
              set: {
                title: event.title,
                description: event.description,
                slug: event.slug,
                tags: event.tags,
                volume: event.volume,
                trendingRank: event.trendingRank,
                updatedAt: sql`NOW()`,
              },
            })
            .returning()
          return result[0]
        } catch (error) {
          console.error(`Error upserting event ${event.id}:`, error)
          return null
        }
      }),
    )
    return results.filter(Boolean)
  },
}

// Market queries
export const marketQueries = {
  // Get markets by event ID
  getMarketsByEventId: async (eventId: string) => {
    return await db.select().from(markets).where(eq(markets.eventId, eventId))
  },

  // Get market by ID
  getMarketById: async (id: string) => {
    const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1)
    return result[0] || null
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
    const results = await Promise.all(
      marketsData.map(async (market) => {
        try {
          const result = await db
            .insert(markets)
            .values(market)
            .onConflictDoUpdate({
              target: markets.id,
              set: {
                question: market.question,
                eventId: market.eventId,
                outcomePrices: market.outcomePrices,
                volume: market.volume,
                liquidity: market.liquidity,
                updatedAt: sql`NOW()`,
              },
            })
            .returning()
          return result[0]
        } catch (error) {
          console.error(`Error upserting market ${market.id}:`, error)
          return null
        }
      }),
    )
    return results.filter(Boolean)
  },
}

// Prediction queries
export const predictionQueries = {
  // Create new prediction
  createPrediction: async (predictionData: NewPrediction) => {
    try {
      const result = await db.insert(predictions).values(predictionData).returning()
      return result[0]
    } catch (error) {
      console.error("Error creating prediction:", error)
      return null
    }
  },

  // Get recent predictions
  getRecentPredictions: async (limit = 10) => {
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(limit)
  },

  // Get prediction by ID
  getPredictionById: async (id: number) => {
    const result = await db.select().from(predictions).where(eq(predictions.id, id)).limit(1)
    return result[0] || null
  },

  // Get prediction by market ID
  getPredictionByMarketId: async (marketId: string) => {
    const result = await db.select().from(predictions).where(eq(predictions.marketId, marketId)).limit(1)
    return result[0] || null
  },

  // Get all predictions for a specific market
  getPredictionsByMarketId: async (marketId: string, limit = 10) => {
    return await db
      .select()
      .from(predictions)
      .where(eq(predictions.marketId, marketId))
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
  },

  // Search predictions by question
  searchPredictionsByQuestion: async (searchTerm: string, limit = 5) => {
    return await db
      .select()
      .from(predictions)
      .where(sql`${predictions.question} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
  },
}
