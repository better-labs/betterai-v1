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
import { executePredictionSession } from '@/lib/services/prediction-session-worker'
import { calculateTotalCreditCost, validateModelIds } from '@/lib/config/ai-models'
import {
  StartPredictionSessionInput,
  GetPredictionSessionStatusInput,
  GetUserRecentSessionsInput,
} from '../schemas/prediction-session'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { structuredLogger } from '@/lib/utils/structured-logger'

export const predictionSessionsRouter = router({
  // Start a new prediction session
  start: authenticatedProcedure
    .input(StartPredictionSessionInput)
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction(async (tx) => {
        try {
          // Check rate limit (10/hour, 50/day per user)
          if (ctx.rateLimitId) {
            const rateLimitResult = await checkRateLimit('predict', ctx.rateLimitId)
            if (!rateLimitResult.success) {
              structuredLogger.predictionRateLimited(ctx.userId, input.marketId)
              throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `Rate limit exceeded. You can create ${rateLimitResult.limit} predictions per hour. Please try again later.`,
              })
            }
          }

          // Validate selected models exist
          const { valid: validModels, invalid: invalidModels } = validateModelIds(input.selectedModels)
          if (invalidModels.length > 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Invalid model IDs: ${invalidModels.join(', ')}`,
            })
          }

          // Calculate required credits based on model costs
          const requiredCredits = calculateTotalCreditCost(validModels)
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

          // Log credit consumption
          structuredLogger.predictionCreditsConsumed(ctx.userId, 'pending', requiredCredits, 'prediction_session_start')

          // Create PredictionSession (status=initializing)
          const { sessionId } = await predictionSessionService.createPredictionSession(tx as any, {
            userId: ctx.userId,
            marketId: input.marketId,
            selectedModels: validModels
          })

          // Log session creation
          structuredLogger.predictionSessionStarted(sessionId, ctx.userId, input.marketId, validModels)

          // Fire worker job immediately (Phase 3)
          // Note: Using setImmediate to execute after transaction commits
          setImmediate(async () => {
            try {
              await executePredictionSession(prisma, sessionId)
            } catch (workerError) {
              console.error(`Worker failed for session ${sessionId}:`, workerError)
              // Worker failure is logged but doesn't affect the session creation response
            }
          })

          return { sessionId }
        } catch (error) {
          // Log structured error
          if (error instanceof Error) {
            structuredLogger.predictionSessionError(
              'pending', // sessionId not available yet
              ctx.userId,
              error,
              { marketId: input.marketId, step: 'session_creation' }
            )
          }

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