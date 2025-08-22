/**
 * tRPC router for prediction-related operations
 * Replaces lib/db/queries/prediction.ts with type-safe, auto-serializing endpoints
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { predictionQueries, marketQueries, predictionCheckQueries } from '@/lib/db/queries'
import { serializeDecimals } from '@/lib/serialization'
import {
  PredictionSchema,
  PredictionWithMarketSchema,
  PredictionCheckSchema,
  CreatePredictionInputSchema,
  UpdatePredictionInputSchema,
  MarketFilterInputSchema,
} from '../schemas'

export const predictionRouter = createTRPCRouter({
  /**
   * Get a single prediction by ID with related market and event data
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .output(PredictionWithMarketSchema.nullable())
    .query(async ({ input }) => {
      const prediction = await predictionQueries.getPredictionWithRelationsByIdSerialized(input.id)
      return prediction
    }),

  /**
   * Get predictions by market ID
   */
  getByMarketId: publicProcedure
    .input(z.object({ marketId: z.string() }))
    .output(z.array(PredictionSchema))
    .query(async ({ input }) => {
      const predictions = await predictionQueries.getPredictionsByMarketIdSerialized(input.marketId)
      return predictions
    }),

  /**
   * Get recent predictions with pagination and filtering
   */
  getRecent: publicProcedure
    .input(MarketFilterInputSchema)
    .output(z.object({
      items: z.array(PredictionWithMarketSchema),
      nextCursor: z.number().nullable(),
    }))
    .query(async ({ input }) => {
      const { limit, cursor, eventId, active, tagIds, sortMode } = input

      if (sortMode === 'markets') {
        // Build where condition for event filters
        const eventTagsWhere = tagIds?.length
          ? {
              some: { tagId: { in: tagIds } },
              none: {
                tag: {
                  label: { in: ['Hide From New', 'Weekly', 'Recurring'] },
                },
              },
            }
          : {
              none: {
                tag: {
                  label: { in: ['Hide From New', 'Weekly', 'Recurring'] },
                },
              },
            }

        // Get markets with recent predictions, sorted by volume
        const markets = await marketQueries.getMarketsWithRecentPredictions({
          eventId,
          active,
          eventTagsWhere,
          limit: limit + 1,
          cursor: cursor ? cursor.toString() : undefined,
        })

        if (markets.length === 0) {
          return { items: [], nextCursor: null }
        }

        // Get most recent prediction for each market
        const marketIds = markets.map((m) => m.id)
        const predictions = await Promise.all(
          marketIds.slice(0, limit).map(async (marketId) => {
            return await predictionQueries.getMostRecentPredictionWithRelationsByMarketIdSerialized(marketId)
          })
        )

        const validPredictions = predictions.filter((p): p is z.infer<typeof PredictionWithMarketSchema> => !!p)
        const hasMore = markets.length > limit
        const nextCursor = hasMore 
          ? (Number(markets[limit - 1]?.id) ?? null) 
          : null

        return { items: validPredictions, nextCursor }
      } else {
        // Predictions mode - traditional pagination
        const eventTagsWherePredictions = tagIds?.length
          ? {
              some: { tagId: { in: tagIds } },
              none: {
                tag: {
                  label: { in: ['Hide From New', 'Weekly', 'Recurring'] },
                },
              },
            }
          : {
              none: {
                tag: {
                  label: { in: ['Hide From New', 'Weekly', 'Recurring'] },
                },
              },
            }

        const predictions = await predictionQueries.getRecentPredictionsWithFilters({
          eventId,
          eventTagsWhere: eventTagsWherePredictions,
          limit: limit + 1,
          cursor,
        })

        const hasMore = predictions.length > limit
        const items = (hasMore ? predictions.slice(0, limit) : predictions) as z.infer<typeof PredictionWithMarketSchema>[]
        const nextCursor = hasMore 
          ? (items[items.length - 1]?.id ? Number(items[items.length - 1].id) : null) 
          : null

        return { items, nextCursor }
      }
    }),

  /**
   * Create a new prediction
   */
  create: publicProcedure
    .input(CreatePredictionInputSchema)
    .output(PredictionSchema)
    .mutation(async ({ input }) => {
      const prediction = await predictionQueries.createPrediction({
        ...input,
        userId: null, // TODO: Get from auth context
      })
      return serializeDecimals(prediction) as any
    }),

  /**
   * Update an existing prediction
   */
  update: publicProcedure
    .input(UpdatePredictionInputSchema)
    .output(PredictionSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      
      const prediction = await predictionQueries.updatePrediction(id, updateData)
      if (!prediction) {
        throw new Error('Prediction not found')
      }
      return serializeDecimals(prediction) as any
    }),

  /**
   * Get prediction checks for a market
   */
  getChecksByMarketId: publicProcedure
    .input(z.object({ 
      marketId: z.string(),
      limit: z.number().min(1).max(100).default(25),
    }))
    .output(z.array(PredictionCheckSchema))
    .query(async ({ input }) => {
      const checks = await predictionCheckQueries.getChecksByMarketIdSerialized(
        input.marketId, 
        input.limit
      )
      return checks
    }),

  /**
   * Search predictions by user message
   */
  search: publicProcedure
    .input(z.object({
      searchTerm: z.string().min(1),
      limit: z.number().min(1).max(50).default(5),
    }))
    .output(z.array(PredictionSchema))
    .query(async ({ input }) => {
      const predictions = await predictionQueries.searchPredictionsByMessageSerialized(
        input.searchTerm,
        input.limit
      )
      return predictions
    }),
})
