/**
 * Inngest Scheduled Function: Update Active Events
 * Replaces Vercel cron with native Inngest scheduling
 * Runs every 12 hours to update active Polymarket events
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { updateActivePolymarketEvents } from '../../services/updateActivePolymarketEvents'
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Update active events - runs every 12 hours
 * Replaces: /api/cron/update-active-events (schedule: "15 star/12 star star star")
 */
export const updateActiveEvents = inngest.createFunction(
  { 
    id: 'update-active-events',
    name: 'Update Active Events (Every 12 Hours)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 15 */12 * * *' // Every 12 hours at :15 minutes
  },
  async ({ step }) => {
    const executionId = `update-active-events-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('update_active_events_started', 'Starting active events update', {
      executionId,
      scheduledTime: new Date().toISOString()
    })

    // Step 1: Update active Polymarket events
    const updateResult = await step.run('update-active-events', async () => {
      const config = {
        delayMs: Number(process.env.POLYMARKET_UPDATE_DELAY_MS ?? 500),
        maxRetries: Number(process.env.POLYMARKET_UPDATE_MAX_RETRIES ?? 3),
        retryDelayMs: Number(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS ?? 2000),
        timeoutMs: Number(process.env.POLYMARKET_UPDATE_TIMEOUT_MS ?? 30000),
        userAgent: process.env.POLYMARKET_UPDATE_USER_AGENT || 'BetterAI/1.0',
        maxBatchFailuresBeforeAbort: Number(process.env.POLYMARKET_UPDATE_MAX_BATCH_FAILURES ?? 3),
      }

      structuredLogger.info('update_active_events_config', 'Using active events update configuration', {
        executionId,
        config
      })

      try {
        const result = await updateActivePolymarketEvents(config)
        
        structuredLogger.info('update_active_events_completed', 'Active events update completed successfully', {
          executionId,
          activeEventsCount: result.activeEventsCount,
          updatedEvents: result.updatedEvents.length,
          updatedMarkets: result.updatedMarkets.length
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('update_active_events_failed', 'Active events update failed', {
          executionId,
          error: {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })

        throw error
      }
    })

    // Step 2: Send heartbeat
    await step.run('send-heartbeat', async () => {
      await sendHeartbeatSafe(HeartbeatType.POLYMARKET_DATA)
    })

    return {
      success: true,
      executionId,
      activeEventsCount: updateResult.activeEventsCount,
      updatedEvents: updateResult.updatedEvents.length,
      updatedMarkets: updateResult.updatedMarkets.length
    }
  }
)