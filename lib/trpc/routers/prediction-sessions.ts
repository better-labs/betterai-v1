/**
 * Prediction Sessions tRPC router - Phase 2 implementation
 * Handles prediction session lifecycle: creation, status polling, batch operations
 * Separate from individual predictions for clarity
 */

import { router, authenticatedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as predictionSessionService from '@/lib/services/prediction-session-service'
import { creditManager } from '@/lib/services/credit-manager'
import {
  StartPredictionSessionInput,
  GetPredictionSessionStatusInput,
  GetUserRecentSessionsInput,
} from '../schemas/prediction-session'

export const predictionSessionsRouter = router({
  // Start a new prediction session
  start: authenticatedProcedure
    .input(StartPredictionSessionInput)
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction(async (tx) => {
        try {
          // Verify credits ≥ models.length
          const requiredCredits = input.selectedModels.length
          const hasCredits = await creditManager.hasCredits(tx as any, ctx.userId, requiredCredits)
          
          if (!hasCredits) {
            const currentCredits = await creditManager.getUserCredits(tx as any, ctx.userId)
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Insufficient credits: ${currentCredits.credits} available, ${requiredCredits} required`,
            })
          }

          // Consume credits
          await creditManager.consumeCredits(
            tx as any,
            ctx.userId, 
            requiredCredits,
            'prediction_session_start',
            { marketId: input.marketId }
          )

          // Create PredictionSession (status=initializing)
          const { sessionId } = await predictionSessionService.createPredictionSession(tx as any, {
            userId: ctx.userId,
            marketId: input.marketId,
            selectedModels: input.selectedModels
          })

          // TODO: Fire worker job immediately (Phase 3)
          console.log(`Created prediction session ${sessionId} for user ${ctx.userId}`)

          return { sessionId }
        } catch (error) {
          console.error('Start prediction session error:', error)
          if (error instanceof TRPCError) {
            throw error
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start prediction session',
            cause: error,
          })
        }
      })
    }),

  // Get prediction session status
  status: authenticatedProcedure
    .input(GetPredictionSessionStatusInput)
    .query(async ({ input, ctx }) => {
      try {
        const session = await predictionSessionService.getPredictionSessionById(
          prisma,
          input.sessionId,
          ctx.userId // Ensure user can only access their own sessions
        )

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prediction session not found or access denied',
          })
        }

        return {
          id: session.id,
          userId: session.userId,
          marketId: session.marketId,
          selectedModels: session.selectedModels,
          status: session.status,
          step: session.step,
          error: session.error,
          createdAt: session.createdAt.toISOString(),
          completedAt: session.completedAt?.toISOString() || null,
          market: session.market,
          predictions: session.predictions.map(pred => ({
            ...pred,
            createdAt: pred.createdAt?.toISOString() || null,
          }))
        }
      } catch (error) {
        console.error('Get prediction session status error:', error)
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get prediction session status',
          cause: error,
        })
      }
    }),

  // Get user's recent sessions for a market (useful for "View last run" links)
  recentByMarket: authenticatedProcedure
    .input(GetUserRecentSessionsInput)
    .query(async ({ input, ctx }) => {
      try {
        const sessions = await predictionSessionService.getUserRecentSessions(
          prisma,
          ctx.userId,
          input.marketId
        )

        return sessions.map(session => ({
          id: session.id,
          createdAt: session.createdAt.toISOString(),
          status: session.status
        }))
      } catch (error) {
        console.error('Get recent sessions error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get recent sessions',
          cause: error,
        })
      }
    }),
})