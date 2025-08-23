import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../server'
import {
  predictionSearchSchema,
  predictionCreateSchema,
} from '../schemas/prediction'
import {
  searchPredictions,
  getRecentPredictions,
  getPredictionsByMarket,
  getPredictionById,
  createPrediction,
  getUserPredictionStats
} from '@/lib/services/predictions'

export const predictionsRouter = router({
  // Search predictions with filters (public for market views)
  search: publicProcedure
    .input(predictionSearchSchema)
    .query(async ({ ctx, input }) => {
      const predictions = await searchPredictions(ctx.prisma, {
        userId: input.userId,
        marketId: input.marketId,
        modelName: input.modelName,
        experimentTag: input.experimentTag,
        confidenceLevel: input.confidenceLevel,
        limit: input.limit,
        page: input.page,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      })
      
      const totalCount = predictions.length // Simplified for now
      const totalPages = Math.ceil(totalCount / input.limit)
      
      return {
        success: true,
        data: {
          predictions,
          totalCount,
          page: input.page,
          totalPages,
          hasMore: input.page < totalPages,
        },
      }
    }),

  // Get single prediction by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const prediction = await getPredictionById(ctx.prisma, input.id)
      
      return {
        success: true,
        data: prediction,
        message: prediction ? undefined : 'Prediction not found',
      }
    }),

  // Get recent predictions for authenticated user
  recent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const predictions = await getRecentPredictions(
        ctx.prisma, 
        ctx.user.id, 
        input.limit
      )
      
      return {
        success: true,
        data: predictions,
      }
    }),

  // Get predictions for a specific market
  byMarket: publicProcedure
    .input(z.object({ 
      marketId: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const predictions = await getPredictionsByMarket(
        ctx.prisma, 
        input.marketId, 
        input.limit
      )
      
      return {
        success: true,
        data: predictions,
      }
    }),

  // Create new prediction (authenticated users only)
  create: protectedProcedure
    .input(predictionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Note: This creates a placeholder prediction
      // In production, this should integrate with the existing
      // generate-single-prediction service for full AI processing
      const prediction = await createPrediction(ctx.prisma, ctx.user.id, {
        marketId: input.marketId,
        userMessage: input.userMessage,
        model: input.model,
        dataSources: input.dataSources,
        experimentTag: input.experimentTag,
        experimentNotes: input.experimentNotes,
      })
      
      return {
        success: true,
        data: prediction,
        message: 'Prediction created successfully',
        // TODO: Get actual credits remaining from user service
        creditsRemaining: undefined,
      }
    }),

  // Get user prediction statistics (authenticated)
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await getUserPredictionStats(ctx.prisma, ctx.user.id)
      
      return {
        success: true,
        data: stats,
      }
    }),

  // Get user's own predictions (authenticated)
  mine: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().optional().default(1),
      limit: z.number().int().positive().max(50).optional().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const predictions = await searchPredictions(ctx.prisma, {
        userId: ctx.user.id,
        limit: input.limit,
        page: input.page,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      
      const totalCount = predictions.length // Simplified for now
      const totalPages = Math.ceil(totalCount / input.limit)
      
      return {
        success: true,
        data: {
          predictions,
          totalCount,
          page: input.page,
          totalPages,
          hasMore: input.page < totalPages,
        },
      }
    }),
})