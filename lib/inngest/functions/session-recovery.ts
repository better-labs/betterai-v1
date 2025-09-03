/**
 * Inngest Scheduled Function: Session Recovery
 * Replaces Vercel cron with native Inngest scheduling
 * Runs every 15 minutes to recover stuck prediction sessions
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { prisma } from '../../db/prisma'
import { recoverStuckSessions, cleanupOldSessions } from '../../services/prediction-session-recovery'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Session recovery - runs every 15 minutes
 * Replaces: /api/cron/session-recovery (schedule: "star/15 star star star star")
 */
export const sessionRecovery = inngest.createFunction(
  { 
    id: 'session-recovery',
    name: 'Session Recovery (Every 15 Minutes)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC */15 * * * *' // Every 15 minutes
  },
  async ({ step }) => {
    const executionId = `session-recovery-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('session_recovery_started', 'Starting prediction session recovery', {
      executionId,
      scheduledTime: new Date().toISOString()
    })

    // Step 1: Recover stuck sessions
    const recoveryResult = await step.run('recover-stuck-sessions', async () => {
      try {
        const result = await recoverStuckSessions(prisma, 10)
        
        structuredLogger.info('session_recovery_completed', 'Stuck session recovery completed', {
          executionId,
          processed: result.processed,
          recovered: result.recovered,
          failed: result.failed
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('session_recovery_failed', 'Stuck session recovery failed', {
          executionId,
          error: {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })

        throw error
      }
    })

    // Step 2: Cleanup old sessions
    const cleanupResult = await step.run('cleanup-old-sessions', async () => {
      try {
        const result = await cleanupOldSessions(prisma, 24)
        
        structuredLogger.info('session_cleanup_completed', 'Old session cleanup completed', {
          executionId,
          deletedCount: result.deletedCount
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('session_cleanup_failed', 'Old session cleanup failed', {
          executionId,
          error: {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })

        throw error
      }
    })

    return {
      success: true,
      executionId,
      recovery: recoveryResult,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString()
    }
  }
)