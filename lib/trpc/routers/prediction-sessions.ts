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
import { calculateTotalCreditCost, validateModelIds } from '@/lib/config/ai-models'
import { calculateResearchSourcesCost, validateResearchSourceId } from '@/lib/config/research-sources'
import {
  StartPredictionSessionInput,
  GetPredictionSessionStatusInput,
  GetUserRecentSessionsInput,
} from '../schemas/prediction-session'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { structuredLogger } from '@/lib/utils/structured-logger'

const StartPredictionSessionWithInngestInput = StartPredictionSessionInput.extend({
  useInngest: z.boolean().optional().default(false)
})

export const predictionSessionsRouter = router({
  // Start a new prediction session with Inngest (modern event-driven approach)
  start: authenticatedProcedure
    .input(StartPredictionSessionWithInngestInput)
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.$transaction(async (tx) => {
        try {
          // Check rate limit (same as legacy start)
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

          // Validate research sources
          for (const sourceId of input.selectedResearchSources) {
            if (!validateResearchSourceId(sourceId)) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Invalid research source: ${sourceId}`,
              })
            }
          }

          // Calculate required credits based on model costs and research sources
          const modelCredits = calculateTotalCreditCost(validModels)
          const researchCredits = calculateResearchSourcesCost(input.selectedResearchSources)
          const requiredCredits = modelCredits + researchCredits
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
            'prediction_session_start_inngest',
            { marketId: input.marketId }
          )

          // Log credit consumption
          structuredLogger.predictionCreditsConsumed(ctx.userId, 'pending', requiredCredits, 'prediction_session_start_inngest')

          // Create PredictionSession with Inngest (status=QUEUED)
          const { sessionId } = await predictionSessionService.createPredictionSession(tx as any, {
            userId: ctx.userId,
            marketId: input.marketId,
            selectedModels: validModels,
            selectedResearchSources: input.selectedResearchSources,
            useInngest: input.useInngest ?? true
          })

          // Log session creation
          structuredLogger.predictionSessionStarted(sessionId, ctx.userId, input.marketId, validModels)

          return { 
            sessionId,
            status: input.useInngest ? 'QUEUED' as const : 'INITIALIZING' as const
          }
        } catch (error) {
          // Log structured error
          if (error instanceof Error) {
            structuredLogger.predictionSessionError(
              'pending',
              ctx.userId,
              error,
              { marketId: input.marketId, step: 'session_creation_inngest' }
            )
          }

          if (error instanceof TRPCError) {
            throw error
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start prediction session with Inngest',
            cause: error,
          })
        }
      })

      return result
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
          })),
          researchData: session.researchData.map(research => ({
            ...research,
            createdAt: research.createdAt?.toISOString() || null,
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