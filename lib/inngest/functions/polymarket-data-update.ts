/**
 * Inngest Scheduled Function: Polymarket Data Update
 * Replaces Vercel cron with native Inngest scheduling
 * Runs every 6 hours to sync Polymarket events and markets
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { updatePolymarketEventsAndMarketData } from '../../services/updatePolymarketEventsAndMarketData'
import { updateActivePolymarketEvents } from '../../services/updateActivePolymarketEvents'
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Regular Polymarket data update - runs every 6 hours
 * Replaces: /api/cron/daily-update-polymarket-data (schedule: "0 star/6 star star star")
 */
export const polymarketDataUpdate = inngest.createFunction(
  { 
    id: 'polymarket-data-update',
    name: 'Polymarket Data Update: Top Events by Volume (Every 6 Hours)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 0 */6 * * *' // Every 6 hours
  },
  async ({ step }) => {
    const executionId = `polymarket-update-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('polymarket_data_update_started', 'Starting Polymarket data update', {
      executionId,
      scheduledTime: new Date().toISOString(),
      updateType: 'regular'
    })

    // Step 1: Update Polymarket data with default parameters
    const updateResult = await step.run('update-polymarket-data', async () => {
      const config = {
        batchSize: Math.min(Number(process.env.POLYMARKET_UPDATE_BATCH_SIZE ?? 50), 100),
        maxEvents: Number(process.env.POLYMARKET_UPDATE_LIMIT ?? 50),
        delayMs: Number(process.env.POLYMARKET_UPDATE_DELAY_MS ?? 1000),
        daysToFetchPast: Number(process.env.POLYMARKET_UPDATE_DAYS_PAST ?? 8),
        maxRetries: Number(process.env.POLYMARKET_UPDATE_MAX_RETRIES ?? 3),
        retryDelayMs: Number(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS ?? 2000),
        timeoutMs: Number(process.env.POLYMARKET_UPDATE_TIMEOUT_MS ?? 30000),
        userAgent: process.env.POLYMARKET_UPDATE_USER_AGENT || 'BetterAI/1.0',
        maxBatchFailuresBeforeAbort: Number(process.env.POLYMARKET_UPDATE_MAX_BATCH_FAILURES ?? 3),
      }

      structuredLogger.info('polymarket_data_update_config', 'Using Polymarket update configuration', {
        executionId,
        config
      })

      try {
        const result = await updatePolymarketEventsAndMarketData(config)
        
        structuredLogger.info('polymarket_data_update_completed', 'Polymarket data update completed successfully', {
          executionId,
          totalRequests: result.totalRequests,
          totalFetched: result.totalFetched,
          insertedEvents: result.insertedEvents.length,
          insertedMarkets: result.insertedMarkets.length
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('polymarket_data_update_failed', 'Polymarket data update failed', {
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
      updateType: 'regular',
      ...updateResult
    }
  }
)

// Extended Polymarket data update has been moved to a separate file:
// lib/inngest/functions/polymarket-data-update-6month.ts
// 
// This separation provides:
// - Clear separation of concerns (daily vs comprehensive updates)
// - Independent scheduling (every 6h vs weekly)
// - Dedicated configuration and monitoring
// - Reduced complexity in this file

/**
 * Update active events - runs every 12 hours
 * Replaces: /api/cron/update-active-events (schedule: "15 star/12 star star star")
 */
export const polymarketUpdateActiveEvents = inngest.createFunction(
  { 
    id: 'polymarket-update-active-events',
    name: 'Polymarket Update Active Events (Every 12 Hours)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 15 */12 * * *' // Every 12 hours at :15 minutes
  },
  async ({ step }) => {
    const executionId = `polymarket-active-events-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('polymarket_update_active_events_started', 'Starting active events update', {
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

      structuredLogger.info('polymarket_update_active_events_config', 'Using active events update configuration', {
        executionId,
        config
      })

      try {
        const result = await updateActivePolymarketEvents(config)
        
        structuredLogger.info('polymarket_update_active_events_completed', 'Active events update completed successfully', {
          executionId,
          activeEventsCount: result.activeEventsCount,
          updatedEvents: result.updatedEvents.length,
          updatedMarkets: result.updatedMarkets.length
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('polymarket_update_active_events_failed', 'Active events update failed', {
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