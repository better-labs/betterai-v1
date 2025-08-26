/**
 * Prediction Session Recovery Service
 * Handles stuck/failed prediction sessions with retry logic
 */

import type { DbClient } from './types'
import { executePredictionSessionWithRetry } from './prediction-session-worker'
import { updatePredictionSession } from './prediction-session-service'
import { structuredLogger } from '../utils/structured-logger'

export interface RecoveryResult {
  processed: number
  recovered: number
  failed: number
  errors: string[]
}

/**
 * Find and recover stuck prediction sessions
 * Sessions stuck in generating/researching status for >10 minutes
 */
export async function recoverStuckSessions(
  db: DbClient,
  timeoutMinutes: number = 10
): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    processed: 0,
    recovered: 0,
    failed: 0,
    errors: []
  }

  try {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000)

    // Find stuck sessions
    const stuckSessions = await db.predictionSession.findMany({
      where: {
        status: {
          in: ['GENERATING', 'RESEARCHING', 'INITIALIZING']
        },
        createdAt: {
          lt: cutoffTime
        }
      },
      select: {
        id: true,
        userId: true,
        marketId: true,
        status: true,
        createdAt: true,
        selectedModels: true
      },
      take: 20 // Process max 20 at a time to avoid overwhelming system
    })

    structuredLogger.info('session_recovery_started', `Found ${stuckSessions.length} stuck sessions`, {
      count: stuckSessions.length,
      timeoutMinutes
    })

    result.processed = stuckSessions.length

    // Process each stuck session
    for (const session of stuckSessions) {
      try {
        structuredLogger.info('session_recovery_processing', `Processing stuck session ${session.id}`, {
          sessionId: session.id,
          userId: session.userId,
          status: session.status,
          ageMinutes: Math.round((Date.now() - session.createdAt.getTime()) / (1000 * 60))
        })

        // Try to recover with retry logic (max 2 attempts for recovery)
        const recoveryResult = await executePredictionSessionWithRetry(db, session.id, 2)

        if (recoveryResult.success || recoveryResult.successCount > 0) {
          result.recovered++
          structuredLogger.info('session_recovery_success', `Successfully recovered session ${session.id}`, {
            sessionId: session.id,
            successCount: recoveryResult.successCount,
            failureCount: recoveryResult.failureCount
          })
        } else {
          result.failed++
          result.errors.push(`Session ${session.id}: ${recoveryResult.error || 'Unknown error'}`)
          
          // Mark as permanently failed
          await updatePredictionSession(db, session.id, {
            status: 'ERROR',
            error: `Recovery failed after timeout: ${recoveryResult.error || 'Multiple retry attempts failed'}`
          })

          structuredLogger.info('session_recovery_failed', `Marked session ${session.id} as failed`, {
            sessionId: session.id,
            error: recoveryResult.error
          })
        }

      } catch (error) {
        result.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Session ${session.id}: ${errorMessage}`)

        structuredLogger.error('session_recovery_error', `Error processing session ${session.id}`, {
          sessionId: session.id,
          error: {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })

        try {
          await updatePredictionSession(db, session.id, {
            status: 'error',
            error: `Recovery error: ${errorMessage}`
          })
        } catch (updateError) {
          // Log but don't fail the entire operation
          structuredLogger.error('session_recovery_update_failed', `Failed to update failed session ${session.id}`, {
            sessionId: session.id,
            updateError: updateError instanceof Error ? updateError.message : 'Unknown error'
          })
        }
      }

      // Small delay between processing to avoid overwhelming the system
      if (stuckSessions.indexOf(session) < stuckSessions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    structuredLogger.info('session_recovery_completed', `Recovery completed`, {
      ...result
    })

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    structuredLogger.error('session_recovery_failed', `Session recovery process failed`, {
      error: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    result.errors.push(`Recovery process failed: ${errorMessage}`)
    return result
  }
}

/**
 * Clean up very old failed sessions (>24h) to keep DB tidy
 */
export async function cleanupOldSessions(
  db: DbClient,
  hoursOld: number = 24
): Promise<{ deletedCount: number }> {
  try {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000)

    const result = await db.predictionSession.deleteMany({
      where: {
        status: 'error',
        createdAt: {
          lt: cutoffTime
        }
      }
    })

    structuredLogger.info('session_cleanup_completed', `Cleaned up ${result.count} old failed sessions`, {
      deletedCount: result.count,
      hoursOld
    })

    return { deletedCount: result.count }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    structuredLogger.error('session_cleanup_failed', `Session cleanup failed`, {
      error: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    return { deletedCount: 0 }
  }
}