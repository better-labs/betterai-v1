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

/**
 * Extended Polymarket data update - runs daily at 2 AM
 * Replaces: /api/cron/daily-update-polymarket-data with extended parameters (schedule: "0 2 star star star")
 */
export const polymarketDataUpdateExtended = inngest.createFunction(
  { 
    id: 'polymarket-data-update-extended',
    name: 'Polymarket Data Update Extended: Top Events by Volume for 6 Months (Daily 2 AM)',
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
      const startTime = Date.now()
      const TIMEOUT_WARNING_MS = 600000 // Warn at 10 minutes (before 13+ minute limit)
      const TIMEOUT_ABORT_MS = 720000   // Abort at 12 minutes (safety margin)
      
      const config = {
        batchSize: 50, // Reduced from 100 for better timeout control
        delayMs: 1000, // delayMs=1000
        daysToFetchPast: 8, // daysToFetchPast=8
        daysToFetchFuture: 180, // daysToFetchFuture=180
        maxRetries: 3, // maxRetries=3
        retryDelayMs: 2000, // retryDelayMs=2000
        timeoutMs: 30000, // timeoutMs=30000
        userAgent: 'BetterAI-6Month/1.0', // userAgent=BetterAI-6Month%2F1.0
        sortBy: 'volume1yr', // sortBy=volume1yr
        maxEvents: Number(process.env.POLYMARKET_6MONTH_UPDATE_LIMIT ?? 3000), // totalEventLimit - reduced for better resource management
        maxBatchFailuresBeforeAbort: Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_BATCH_FAILURES ?? 3),
        
        // Add timeout monitoring callback
        onBatchComplete: async (batchNumber: number, totalTimeMs: number, eventsProcessed: number) => {
          if (totalTimeMs > TIMEOUT_WARNING_MS) {
            structuredLogger.warn('timeout_warning', `Approaching timeout at batch ${batchNumber}`, {
              executionId,
              batchNumber,
              elapsedMs: totalTimeMs,
              remainingMs: TIMEOUT_ABORT_MS - totalTimeMs,
              eventsProcessed
            })
          }
          
          if (totalTimeMs > TIMEOUT_ABORT_MS) {
            structuredLogger.error('timeout_abort', `Aborting at batch ${batchNumber} to prevent timeout`, {
              executionId,
              batchNumber,
              elapsedMs: totalTimeMs,
              eventsProcessed
            })
            
            throw new Error(`TIMEOUT_ABORT: Processed ${batchNumber} batches (${eventsProcessed} events) before timeout`)
          }
        }
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
        
        // Handle timeout abort as partial success rather than failure
        if (errorMessage.includes('TIMEOUT_ABORT')) {
          structuredLogger.info('polymarket_data_update_extended_partial', 'Extended Polymarket data update completed partially due to timeout prevention', {
            executionId,
            elapsedMs: Date.now() - startTime,
            reason: 'timeout_prevention'
          })
          
          // Return partial success result
          return {
            insertedEvents: [],
            insertedMarkets: [],
            totalRequests: 0,
            totalFetched: 0,
            partialSuccess: true,
            abortReason: 'timeout_prevention'
          }
        }
        
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