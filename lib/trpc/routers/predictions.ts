/**
 * Predictions tRPC router - Phase 5C implementation
 * Implements user predictions with market context, prediction statistics and history
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure, authenticatedProcedure, adminProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'
import { mapPredictionToDTO } from '@/lib/dtos'
import {
  GetPredictionsInput,
  GetPredictionByIdInput,
  GetPredictionsByMarketInput,
  GetRecentPredictionsInput,
  SearchPredictionsInput,
  GetMostRecentPredictionInput,
  CreatePredictionInput,
  UpdatePredictionInput,
  DeletePredictionInput,
  BatchCreatePredictionsInput,
} from '../schemas/prediction'

export const predictionsRouter = router({
  // Single prediction query by ID
  getById: publicProcedure
    .input(GetPredictionByIdInput)
    .query(async ({ input }) => {
      const prediction = await predictionService.getPredictionWithRelationsByIdSerialized(
        prisma, 
        input.id
      )
      if (!prediction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prediction not found',
        })
      }
      return prediction
    }),

  // List predictions with various filters (main endpoint)
  list: publicProcedure
    .input(GetPredictionsInput)
    .query(async ({ input }) => {
      // Single prediction by ID
      if (input.id) {
        const prediction = await predictionService.getPredictionWithRelationsByIdSerialized(
          prisma, 
          input.id
        )
        if (!prediction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prediction not found',
          })
        }
        return {
          items: [prediction],
          nextCursor: null,
          hasMore: false,
        }
      }

      // Predictions by market ID
      if (input.marketId) {
        const predictions = await predictionService.getPredictionsByMarketIdSerialized(
          prisma, 
          input.marketId
        )
        return {
          items: predictions,
          nextCursor: null,
          hasMore: false,
        }
      }

      // Search in user messages
      if (input.search) {
        const predictions = await predictionService.searchPredictionsByUserMessage(
          prisma, 
          input.search, 
          input.limit
        )
        const predictionsDTO = predictions.map(p => mapPredictionToDTO(p))
        return {
          items: predictionsDTO,
          nextCursor: null,
          hasMore: false,
        }
      }

      // Recent predictions with filtering
      if (input.tagIds && input.tagIds.length > 0) {
        const result = await predictionService.getRecentPredictionsWithRelationsFilteredByTags(
          prisma,
          input.tagIds,
          input.limit,
          input.cursor,
          input.sortMode
        )

        const predictionsDTO = result.items.map(prediction => {
          const baseDTO = mapPredictionToDTO(prediction)
          return {
            ...baseDTO,
            // Include market context if available
            ...(input.includeMarket && prediction.market && {
              market: {
                ...prediction.market,
                volume: prediction.market.volume?.toString() || '0',
                liquidity: prediction.market.liquidity?.toString() || '0',
                outcomePrices: Array.isArray(prediction.market.outcomePrices) 
                  ? prediction.market.outcomePrices.map((price: any) => 
                      typeof price === 'string' ? parseFloat(price) : Number(price)
                    )
                  : [],
                event: prediction.market.event ? {
                  ...prediction.market.event,
                  volume: prediction.market.event.volume?.toString() || '0',
                  endDate: prediction.market.event.endDate?.toISOString() || null,
                  startDate: prediction.market.event.startDate?.toISOString() || null,
                  updatedAt: prediction.market.event.updatedAt?.toISOString() || null,
                } : null,
              }
            })
          }
        })

        return {
          items: predictionsDTO,
          nextCursor: result.nextCursor,
          hasMore: !!result.nextCursor,
        }
      }

      // Default: get recent predictions
      const result = await predictionService.getRecentPredictionsWithRelationsPaginated(
        prisma,
        input.limit,
        input.cursor,
        input.sortMode
      )

      const predictionsDTO = result.items.map(prediction => {
        const baseDTO = mapPredictionToDTO(prediction)
        return {
          ...baseDTO,
          // Include market context if available
          ...(input.includeMarket && prediction.market && {
            market: {
              ...prediction.market,
              volume: prediction.market.volume?.toString() || '0',
              liquidity: prediction.market.liquidity?.toString() || '0',
              outcomePrices: Array.isArray(prediction.market.outcomePrices) 
                ? prediction.market.outcomePrices.map((price: any) => 
                    typeof price === 'string' ? parseFloat(price) : Number(price)
                  )
                : [],
              event: prediction.market.event ? {
                ...prediction.market.event,
                volume: prediction.market.event.volume?.toString() || '0',
                endDate: prediction.market.event.endDate?.toISOString() || null,
                startDate: prediction.market.event.startDate?.toISOString() || null,
                updatedAt: prediction.market.event.updatedAt?.toISOString() || null,
              } : null,
            }
          })
        }
      })

      return {
        items: predictionsDTO,
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor,
      }
    }),

  // Get predictions by market ID (dedicated endpoint)
  byMarket: publicProcedure
    .input(GetPredictionsByMarketInput)
    .query(async ({ input }) => {
      const predictions = await predictionService.getPredictionsByMarketIdSerialized(
        prisma, 
        input.marketId
      )
      return {
        items: predictions,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Get recent predictions (feed endpoint)
  recent: publicProcedure
    .input(GetRecentPredictionsInput)
    .query(async ({ input }) => {
      if (input.tagIds && input.tagIds.length > 0) {
        const result = await predictionService.getRecentPredictionsWithRelationsFilteredByTags(
          prisma,
          input.tagIds,
          input.limit,
          input.cursor,
          input.sortMode
        )

        const predictionsDTO = result.items.map(prediction => {
          const baseDTO = mapPredictionToDTO(prediction)
          return {
            ...baseDTO,
            market: prediction.market ? {
              ...prediction.market,
              volume: prediction.market.volume?.toString() || '0',
              liquidity: prediction.market.liquidity?.toString() || '0',
              outcomePrices: Array.isArray(prediction.market.outcomePrices) 
                ? prediction.market.outcomePrices.map((price: any) => 
                    typeof price === 'string' ? parseFloat(price) : Number(price)
                  )
                : [],
              event: prediction.market.event ? {
                ...prediction.market.event,
                volume: prediction.market.event.volume?.toString() || '0',
                endDate: prediction.market.event.endDate?.toISOString() || null,
                startDate: prediction.market.event.startDate?.toISOString() || null,
                updatedAt: prediction.market.event.updatedAt?.toISOString() || null,
              } : null,
            } : null
          }
        })

        return {
          items: predictionsDTO,
          nextCursor: result.nextCursor,
          hasMore: !!result.nextCursor,
        }
      }

      const result = await predictionService.getRecentPredictionsWithRelationsPaginated(
        prisma,
        input.limit,
        input.cursor,
        input.sortMode
      )

      const predictionsDTO = result.items.map(prediction => {
        const baseDTO = mapPredictionToDTO(prediction)
        return {
          ...baseDTO,
          market: prediction.market ? {
            ...prediction.market,
            volume: prediction.market.volume?.toString() || '0',
            liquidity: prediction.market.liquidity?.toString() || '0',
            outcomePrices: Array.isArray(prediction.market.outcomePrices) 
              ? prediction.market.outcomePrices.map((price: any) => 
                  typeof price === 'string' ? parseFloat(price) : Number(price)
                )
              : [],
            event: prediction.market.event ? {
              ...prediction.market.event,
              volume: prediction.market.event.volume?.toString() || '0',
              endDate: prediction.market.event.endDate?.toISOString() || null,
              startDate: prediction.market.event.startDate?.toISOString() || null,
              updatedAt: prediction.market.event.updatedAt?.toISOString() || null,
            } : null,
          } : null
        }
      })

      return {
        items: predictionsDTO,
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor,
      }
    }),

  // Search predictions by user message
  search: publicProcedure
    .input(SearchPredictionsInput)
    .query(async ({ input }) => {
      const predictions = await predictionService.searchPredictionsByUserMessage(
        prisma, 
        input.query, 
        input.limit
      )

      const predictionsDTO = predictions.map(p => mapPredictionToDTO(p))

      return {
        items: predictionsDTO,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Get most recent prediction for a market
  mostRecentByMarket: publicProcedure
    .input(GetMostRecentPredictionInput)
    .query(async ({ input }) => {
      const prediction = await predictionService.getMostRecentPredictionByMarketIdSerialized(
        prisma, 
        input.marketId
      )
      return prediction // Can be null if no predictions exist
    }),

  // Create prediction (authenticated users)
  create: authenticatedProcedure
    .input(CreatePredictionInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // Prepare prediction data
        const predictionData = {
          userMessage: input.userMessage,
          marketId: input.marketId,
          predictionResult: input.predictionResult,
          modelName: input.modelName || null,
          systemPrompt: input.systemPrompt || null,
          aiResponse: input.aiResponse || null,
          outcomes: input.outcomes,
          outcomesProbabilities: input.outcomesProbabilities.map(p => p.toString()), // Convert to string for Prisma Decimal
          userId: ctx.userId,
          experimentTag: input.experimentTag || null,
          experimentNotes: input.experimentNotes || null,
        }

        const prediction = await predictionService.createPrediction(prisma, predictionData)
        return mapPredictionToDTO(prediction)
      } catch (error) {
        console.error('Create prediction error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create prediction',
          cause: error,
        })
      }
    }),

  // Update prediction (admin only)
  update: adminProcedure
    .input(UpdatePredictionInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateFields } = input
        
        // Prepare update data
        const predictionData = {
          ...(updateFields.userMessage && { userMessage: updateFields.userMessage }),
          ...(updateFields.predictionResult && { predictionResult: updateFields.predictionResult }),
          ...(updateFields.modelName !== undefined && { modelName: updateFields.modelName }),
          ...(updateFields.systemPrompt !== undefined && { systemPrompt: updateFields.systemPrompt }),
          ...(updateFields.aiResponse !== undefined && { aiResponse: updateFields.aiResponse }),
          ...(updateFields.outcomes && { outcomes: updateFields.outcomes }),
          ...(updateFields.outcomesProbabilities && { 
            outcomesProbabilities: updateFields.outcomesProbabilities.map(p => p.toString())
          }),
          ...(updateFields.experimentTag !== undefined && { experimentTag: updateFields.experimentTag }),
          ...(updateFields.experimentNotes !== undefined && { experimentNotes: updateFields.experimentNotes }),
        }

        const prediction = await predictionService.updatePrediction(prisma, id, predictionData)
        if (!prediction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prediction not found',
          })
        }

        return mapPredictionToDTO(prediction)
      } catch (error) {
        console.error('Update prediction error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update prediction',
          cause: error,
        })
      }
    }),

  // Delete prediction (admin only)
  delete: adminProcedure
    .input(DeletePredictionInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await predictionService.deletePrediction(prisma, input.id)
        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prediction not found',
          })
        }

        return { success: true, message: 'Prediction deleted' }
      } catch (error) {
        console.error('Delete prediction error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete prediction',
          cause: error,
        })
      }
    }),

  // Batch create predictions (admin only)
  batchCreate: adminProcedure
    .input(BatchCreatePredictionsInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const results = []
        
        // Process predictions in sequence to avoid overwhelming the database
        for (const predictionInput of input.predictions) {
          const predictionData = {
            userMessage: predictionInput.userMessage,
            marketId: predictionInput.marketId,
            predictionResult: predictionInput.predictionResult,
            modelName: predictionInput.modelName || null,
            systemPrompt: predictionInput.systemPrompt || null,
            aiResponse: predictionInput.aiResponse || null,
            outcomes: predictionInput.outcomes,
            outcomesProbabilities: predictionInput.outcomesProbabilities.map((p: number) => p.toString()),
            userId: null, // Admin batch creation doesn't assign to specific user
            experimentTag: predictionInput.experimentTag || null,
            experimentNotes: predictionInput.experimentNotes || null,
          }

          const prediction = await predictionService.createPrediction(prisma, predictionData)
          results.push(mapPredictionToDTO(prediction))
        }

        return {
          success: true,
          message: `Created ${results.length} predictions`,
          predictions: results,
        }
      } catch (error) {
        console.error('Batch create predictions error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to batch create predictions',
          cause: error,
        })
      }
    }),
})