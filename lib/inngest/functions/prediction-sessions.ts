/**
 * Inngest Prediction Session Function
 * Handles real-time prediction session processing using Inngest events
 * Migrates from direct worker execution to event-driven architecture
 */

import { inngest } from '../client'
import { prisma } from '@/lib/db/prisma'
import { executePredictionSession } from '@/lib/services/prediction-session-worker'
import { updatePredictionSession, getPredictionSessionById } from '@/lib/services/prediction-session-service'
import { structuredLogger } from '@/lib/utils/structured-logger'
import { z } from 'zod'

// Event schema for prediction session requested
export const PredictionSessionRequestedSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  marketId: z.string().min(1),
  selectedModels: z.array(z.string()).min(1),
  selectedResearchSources: z.array(z.string()).min(1), // Required multiple research sources
  retryCount: z.number().default(0).optional()
})

export type PredictionSessionRequestedEvent = z.infer<typeof PredictionSessionRequestedSchema>

/**
 * Main prediction session processing function
 * Triggered by 'prediction.session.requested' event
 */
export const predictionSessionProcessor = inngest.createFunction(
  {
    id: 'Prediction Session: Process Realtime',
    retries: 3,
    timeouts: { finish: '15m' } // Allow up to 15 minutes for complete session execution
  },
  { event: 'prediction.session.requested' },
  async ({ event, step }) => {
    const { sessionId, userId, marketId, selectedModels, selectedResearchSources, retryCount = 0 } = event.data

    // Validate event data
    const validation = PredictionSessionRequestedSchema.safeParse(event.data)
    if (!validation.success) {
      throw new Error(`Invalid event data: ${validation.error.message}`)
    }

    // Step 1: Validate session exists and is in correct state
    await step.run('validate-session', async () => {
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
        // Execute prediction session with research sources from event
        const workerResult = await executePredictionSession(
          prisma, 
          sessionId,
          selectedResearchSources
        )
        
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
 * Manual session recovery function for specific stuck sessions
 * Triggered by events when you need to recover a specific session
 */
export const manualSessionRecovery = inngest.createFunction(
  {
    id: 'Prediction Session: Recovery Manual',
    retries: 1,
    timeouts: { finish: '5m' }
  },
  { event: 'Prediction Session: Recovery Manual' },
  async ({ event, step }) => {
    const { sessionId, reason = 'manual_recovery' } = event.data

    const recoveredSession = await step.run('recover-session', async () => {
      const session = await getPredictionSessionById(prisma, sessionId)
      
      if (!session) {
        throw new Error(`Session not found for recovery: ${sessionId}`)
      }

      // Only recover sessions that are stuck in QUEUED or GENERATING state
      if (!['QUEUED', 'GENERATING'].includes(session.status)) {
        structuredLogger.info('prediction_session_recovery_skipped', `Session ${sessionId} not in recoverable state`, {
          sessionId,
          currentStatus: session.status,
          reason
        })
        return { recovered: false, reason: 'not_recoverable_state' }
      }

      // Check if session has been stuck for more than 5 minutes
      const stuckThreshold = 5 * 60 * 1000 // 5 minutes
      const timeSinceCreated = Date.now() - session.createdAt.getTime()
      
      if (timeSinceCreated < stuckThreshold) {
        return { recovered: false, reason: 'not_stuck_long_enough' }
      }

      // For GENERATING sessions, first reset status to QUEUED
      if (session.status === 'GENERATING') {
        await updatePredictionSession(prisma, sessionId, {
          status: 'QUEUED',
          step: 'Reset for recovery processing',
          error: null
        })
      }

      // Re-trigger the session processing event
      await inngest.send({
        name: 'prediction.session.requested',
        data: {
          sessionId: session.id,
          userId: session.userId,
          marketId: session.marketId,
          selectedModels: session.selectedModels,
          selectedResearchSources: session.selectedResearchSources || [], // Get from session
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

/**
 * Scheduled session recovery function 
 * Runs every hour to find and recover stuck sessions
 */
export const scheduledSessionRecovery = inngest.createFunction(
  {
    id: 'Prediction Session: Recovery (Every Hour)',
    retries: 2,
    timeouts: { finish: '10m' }
  },
  { cron: 'TZ=UTC 0 * * * *' }, // Every hour
  async ({ step }) => {
    const recoveryResults = await step.run('find-and-recover-stuck-sessions', async () => {
      // Find stuck sessions older than 5 minutes
      const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000)
      
      const stuckSessions = await prisma.predictionSession.findMany({
        where: {
          status: { in: ['QUEUED', 'GENERATING'] },
          createdAt: { lt: stuckThreshold }
        },
        select: { id: true, userId: true, marketId: true, selectedModels: true, status: true }
      })

      const results = {
        found: stuckSessions.length,
        recovered: 0,
        failed: 0
      }

      // Trigger recovery for each stuck session
      for (const session of stuckSessions) {
        try {
          // Reset GENERATING sessions to QUEUED
          if (session.status === 'GENERATING') {
            await updatePredictionSession(prisma, session.id, {
              status: 'QUEUED',
              step: 'Reset by scheduled recovery',
              error: null
            })
          }

          // Send recovery event
          await inngest.send({
            name: 'prediction.session.requested',
            data: {
              sessionId: session.id,
              userId: session.userId,
              marketId: session.marketId,
              selectedModels: session.selectedModels,
              selectedResearchSources: [], // Default empty for recovery 
              retryCount: 1
            }
          })

          results.recovered++
          
          structuredLogger.info('scheduled_session_recovery', `Recovered stuck session ${session.id}`, {
            sessionId: session.id,
            previousStatus: session.status
          })
        } catch (error) {
          results.failed++
          structuredLogger.error('scheduled_session_recovery_failed', `Failed to recover session ${session.id}`, {
            sessionId: session.id,
            error: error instanceof Error ? { message: error.message, stack: error.stack } : { message: 'Unknown error' }
          })
        }
      }

      if (results.found > 0) {
        structuredLogger.info('scheduled_session_recovery_completed', 'Scheduled session recovery completed', results)
      }

      return results
    })

    return recoveryResults
  }
)