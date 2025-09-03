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
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Regular Polymarket data update - runs every 6 hours
 * Replaces: /api/cron/daily-update-polymarket-data (schedule: "0 star/6 star star star")
 */
export const polymarketDataUpdate = inngest.createFunction(
  { 
    id: 'polymarket-data-update',
    name: 'Polymarket Data Update (Every 6 Hours)',
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
        batchSize: Math.min(Number(process.env.POLYMARKET_UPDATE_LIMIT ?? 50), 100),
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

/**
 * Extended Polymarket data update - runs daily at 2 AM
 * Replaces: /api/cron/daily-update-polymarket-data with extended parameters (schedule: "0 2 star star star")
 */
export const polymarketDataUpdateExtended = inngest.createFunction(
  { 
    id: 'polymarket-data-update-extended',
    name: 'Polymarket Data Update Extended (Daily 2 AM)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 0 2 * * *' // Daily at 2 AM UTC
  },
  async ({ step }) => {
    const executionId = `polymarket-extended-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('polymarket_data_update_extended_started', 'Starting extended Polymarket data update', {
      executionId,
      scheduledTime: new Date().toISOString(),
      updateType: 'extended'
    })

    // Step 1: Update Polymarket data with extended parameters (from vercel.json)
    const updateResult = await step.run('update-polymarket-data-extended', async () => {
      const config = {
        batchSize: 100, // limit=100
        delayMs: 1000, // delayMs=1000
        daysToFetchPast: 8, // daysToFetchPast=8
        daysToFetchFuture: 180, // daysToFetchFuture=180
        maxRetries: 3, // maxRetries=3
        retryDelayMs: 2000, // retryDelayMs=2000
        timeoutMs: 30000, // timeoutMs=30000
        userAgent: 'BetterAI-6Month/1.0', // userAgent=BetterAI-6Month%2F1.0
        sortBy: 'volume1yr', // sortBy=volume1yr
        maxEvents: 100, // totalEventLimit=100
        maxBatchFailuresBeforeAbort: Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_BATCH_FAILURES ?? 3),
      }

      structuredLogger.info('polymarket_data_update_extended_config', 'Using extended Polymarket update configuration', {
        executionId,
        config
      })

      try {
        const result = await updatePolymarketEventsAndMarketData(config)
        
        structuredLogger.info('polymarket_data_update_extended_completed', 'Extended Polymarket data update completed successfully', {
          executionId,
          totalRequests: result.totalRequests,
          totalFetched: result.totalFetched,
          insertedEvents: result.insertedEvents.length,
          insertedMarkets: result.insertedMarkets.length
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('polymarket_data_update_extended_failed', 'Extended Polymarket data update failed', {
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
      updateType: 'extended',
      ...updateResult
    }
  }
)