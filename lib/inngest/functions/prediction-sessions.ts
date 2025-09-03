/**
 * Inngest Prediction Session Function
 * Handles real-time prediction session processing using Inngest events
 * Migrates from direct worker execution to event-driven architecture
 */

import { inngest } from '../client'
import { prisma } from '@/lib/db/prisma'
import { executePredictionSession } from '@/lib/services/prediction-session-worker'
import { updatePredictionSession, getPredictionSessionById } from '@/lib/services/prediction-session-service'
import { creditManager } from '@/lib/services/credit-manager'
import { structuredLogger } from '@/lib/utils/structured-logger'
import { z } from 'zod'

// Event schema for prediction session requested
export const PredictionSessionRequestedSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  marketId: z.string().min(1),
  selectedModels: z.array(z.string()).min(1),
  retryCount: z.number().default(0).optional()
})

export type PredictionSessionRequestedEvent = z.infer<typeof PredictionSessionRequestedSchema>

/**
 * Main prediction session processing function
 * Triggered by 'prediction.session.requested' event
 */
export const predictionSessionProcessor = inngest.createFunction(
  {
    id: 'prediction-session-processor',
    retries: 3,
    timeouts: { finish: '15m' } // Allow up to 15 minutes for complete session execution
  },
  { event: 'prediction.session.requested' },
  async ({ event, step }) => {
    const { sessionId, userId, marketId, selectedModels, retryCount = 0 } = event.data

    // Validate event data
    const validation = PredictionSessionRequestedSchema.safeParse(event.data)
    if (!validation.success) {
      throw new Error(`Invalid event data: ${validation.error.message}`)
    }

    // Step 1: Validate session exists and is in correct state
    const session = await step.run('validate-session', async () => {
      const session = await getPredictionSessionById(prisma, sessionId, userId)
      
      if (!session) {
        throw new Error(`Session not found or access denied: ${sessionId}`)
      }

      // Only process sessions in QUEUED or INITIALIZING state
      if (!['QUEUED', 'INITIALIZING'].includes(session.status)) {
        throw new Error(`Session ${sessionId} is not in processable state: ${session.status}`)
      }

      structuredLogger.info('prediction_session_inngest_started', `Starting Inngest processing for session ${sessionId}`, {
        sessionId,
        userId,
        marketId,
        modelCount: selectedModels.length,
        retryCount
      })

      return session
    })

    // Step 2: Update session to GENERATING status
    await step.run('update-session-generating', async () => {
      await updatePredictionSession(prisma, sessionId, {
        status: 'GENERATING',
        step: 'Processing via Inngest queue'
      })
    })

    // Step 3: Execute prediction session with existing worker logic
    const result = await step.run('execute-predictions', async () => {
      try {
        const workerResult = await executePredictionSession(prisma, sessionId)
        
        structuredLogger.info('prediction_session_inngest_completed', `Inngest processing completed for session ${sessionId}`, {
          sessionId,
          userId,
          success: workerResult.success,
          successCount: workerResult.successCount,
          failureCount: workerResult.failureCount,
          totalModels: workerResult.totalModels,
          retryCount
        })

        return workerResult
      } catch (error) {
        // Log error and handle session state
        if (error instanceof Error) {
          structuredLogger.predictionSessionError(
            sessionId,
            userId,
            error,
            { step: 'inngest_execution', retryCount }
          )
        }

        // Update session to error state
        await updatePredictionSession(prisma, sessionId, {
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown Inngest processing error'
        })

        throw error
      }
    })

    return {
      sessionId,
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalModels: result.totalModels
    }
  }
)

/**
 * Session recovery function for stuck QUEUED sessions
 * Can be triggered manually or by cron job
 */
export const predictionSessionRecovery = inngest.createFunction(
  {
    id: 'prediction-session-recovery',
    retries: 1,
    timeouts: { finish: '5m' }
  },
  { event: 'prediction.session.recovery' },
  async ({ event, step }) => {
    const { sessionId, reason = 'manual_recovery' } = event.data

    const recoveredSession = await step.run('recover-session', async () => {
      const session = await getPredictionSessionById(prisma, sessionId)
      
      if (!session) {
        throw new Error(`Session not found for recovery: ${sessionId}`)
      }

      // Only recover sessions that are stuck in QUEUED state
      if (session.status !== 'QUEUED') {
        structuredLogger.info('prediction_session_recovery_skipped', `Session ${sessionId} not in QUEUED state`, {
          sessionId,
          currentStatus: session.status,
          reason
        })
        return { recovered: false, reason: 'not_queued' }
      }

      // Check if session has been stuck for more than 5 minutes
      const stuckThreshold = 5 * 60 * 1000 // 5 minutes
      const timeSinceCreated = Date.now() - session.createdAt.getTime()
      
      if (timeSinceCreated < stuckThreshold) {
        return { recovered: false, reason: 'not_stuck_long_enough' }
      }

      // Re-trigger the session processing event
      await inngest.send({
        name: 'prediction.session.requested',
        data: {
          sessionId: session.id,
          userId: session.userId,
          marketId: session.marketId,
          selectedModels: session.selectedModels,
          retryCount: 1
        }
      })

      structuredLogger.info('prediction_session_recovery_triggered', `Recovery triggered for stuck session ${sessionId}`, {
        sessionId,
        userId: session.userId,
        timeSinceCreated,
        reason
      })

      return { recovered: true, reason: 'recovery_triggered' }
    })

    return recoveredSession
  }
)