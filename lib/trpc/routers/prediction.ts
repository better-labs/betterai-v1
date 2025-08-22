/**
 * tRPC router for prediction-related operations
 * Replaces lib/db/queries/prediction.ts with type-safe, auto-serializing endpoints
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { prisma } from '@/lib/db/prisma'
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
      const prediction = await prisma.prediction.findUnique({
        where: { id: input.id },
        include: {
          market: {
            include: {
              event: true,
            },
          },
        },
      })

      if (!prediction) return null

      // superjson automatically handles Decimal -> number conversion
      return prediction
    }),

  /**
   * Get predictions by market ID
   */
  getByMarketId: publicProcedure
    .input(z.object({ marketId: z.string() }))
    .output(z.array(PredictionSchema))
    .query(async ({ input }) => {
      const predictions = await prisma.prediction.findMany({
        where: { marketId: input.marketId },
        orderBy: { createdAt: 'desc' },
        include: {
          market: true,
        },
      })

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
        // Get markets with recent predictions, sorted by volume
        const markets = await prisma.market.findMany({
          where: {
            ...(eventId && { eventId }),
            ...(active !== undefined && { active }),
            volume: { not: null },
            predictions: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
                },
              },
            },
            event: {
              eventTags: {
                ...(tagIds?.length
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
                    }),
              },
            },
          },
          orderBy: [{ volume: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor.toString() }, skip: 1 } : {}),
          select: { id: true },
        })

        // Get most recent prediction for each market
        const marketIds = markets.map((m) => m.id)
        if (marketIds.length === 0) {
          return { items: [], nextCursor: null }
        }

        const predictions = await Promise.all(
          marketIds.slice(0, limit).map(async (marketId) => {
            return await prisma.prediction.findFirst({
              where: {
                marketId,
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
              },
              orderBy: { createdAt: 'desc' },
              include: {
                market: {
                  include: { event: true },
                },
              },
            })
          })
        )

        const validPredictions = predictions.filter(Boolean)
        const hasMore = markets.length > limit
        const nextCursor = hasMore 
          ? (Number(markets[limit - 1]?.id) ?? null) 
          : null

        return { items: validPredictions, nextCursor }
      } else {
        // Predictions mode - traditional pagination
        const whereCondition: any = {
          ...(eventId && { market: { eventId } }),
          market: {
            ...(eventId && { eventId }),
            event: {
              eventTags: {
                ...(tagIds?.length
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
                    }),
              },
            },
          },
          outcomesProbabilities: {
            isEmpty: false,
          },
        }

        const predictions = await prisma.prediction.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            market: {
              include: { event: true },
            },
          },
        })

        const hasMore = predictions.length > limit
        const items = hasMore ? predictions.slice(0, limit) : predictions
        const nextCursor = hasMore 
          ? (items[items.length - 1]?.id ?? null) 
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
      const prediction = await prisma.prediction.create({
        data: {
          ...input,
          userId: null, // TODO: Get from auth context
        },
      })

      return prediction
    }),

  /**
   * Update an existing prediction
   */
  update: publicProcedure
    .input(UpdatePredictionInputSchema)
    .output(PredictionSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      
      const prediction = await prisma.prediction.update({
        where: { id },
        data: updateData,
      })

      return prediction
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
      const checks = await prisma.predictionCheck.findMany({
        where: { marketId: input.marketId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })

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
      const predictions = await prisma.prediction.findMany({
        where: {
          userMessage: {
            contains: input.searchTerm,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })

      return predictions
    }),
})
