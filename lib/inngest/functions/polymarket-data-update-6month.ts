/**
 * Inngest Scheduled Function: Polymarket 6-Month Data Update
 * Separate high-volume job for comprehensive 6-month market analysis
 * Runs weekly on Sundays at 1 AM UTC for comprehensive data collection
 * 
 * This is completely separate from the daily updates and focuses on:
 * - Long-term event horizons (6 months ahead)
 * - High-volume events sorted by annual volume
 * - Comprehensive market coverage (up to 3000+ events)
 */

import { inngest } from '../client'
import { updatePolymarketEventsAndMarketData } from '../../services/updatePolymarketEventsAndMarketData'
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Weekly 6-Month Polymarket data update - runs Sundays at 1 AM
 * Completely separate from daily updates, focuses on long-term comprehensive coverage
 */
export const polymarketDataUpdate6Month = inngest.createFunction(
  { 
    id: 'polymarket-data-update-6month',
    name: 'Polymarket 6-Month Data Update: Weekly Comprehensive Analysis (Sundays 1 AM)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 0 1 * * 0' // Weekly on Sundays at 1 AM UTC
  },
  async ({ step }) => {
    const executionId = `polymarket-6month-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('polymarket_6month_update_started', 'Starting 6-month Polymarket data update', {
      executionId,
      scheduledTime: new Date().toISOString(),
      updateType: '6month-comprehensive'
    })

    // Step 1: Update Polymarket data with 6-month specific parameters
    const updateResult = await step.run('update-polymarket-6month-data', async () => {
      const startTime = Date.now()
      const TIMEOUT_WARNING_MS = 600000 // Warn at 10 minutes
      const TIMEOUT_ABORT_MS = 720000   // Abort at 12 minutes (safety margin)
      
      const config = {
        // 6-Month specific configuration
        batchSize: Number(process.env.POLYMARKET_6MONTH_UPDATE_BATCH_SIZE ?? 50),
        delayMs: Number(process.env.POLYMARKET_6MONTH_UPDATE_DELAY_MS ?? 1000),
        daysToFetchPast: Number(process.env.POLYMARKET_6MONTH_UPDATE_DAYS_PAST ?? 8),
        daysToFetchFuture: Number(process.env.POLYMARKET_6MONTH_UPDATE_DAYS_FUTURE ?? 180), // 6 months
        maxRetries: Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_RETRIES ?? 3),
        retryDelayMs: Number(process.env.POLYMARKET_6MONTH_UPDATE_RETRY_DELAY_MS ?? 2000),
        timeoutMs: Number(process.env.POLYMARKET_6MONTH_UPDATE_TIMEOUT_MS ?? 30000),
        userAgent: process.env.POLYMARKET_6MONTH_UPDATE_USER_AGENT || 'BetterAI-6Month/1.0',
        sortBy: process.env.POLYMARKET_6MONTH_UPDATE_SORT_BY || 'volume1yr', // Annual volume sorting
        maxEvents: Number(process.env.POLYMARKET_6MONTH_MAX_EVENTS_LIMIT ?? 3000), // High event limit
        maxBatchFailuresBeforeAbort: Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_BATCH_FAILURES ?? 3),
        
        // Add timeout monitoring callback
        onBatchComplete: async (batchNumber: number, totalTimeMs: number, eventsProcessed: number) => {
          if (totalTimeMs > TIMEOUT_WARNING_MS) {
            structuredLogger.warn('timeout_warning_6month', `6-month update approaching timeout at batch ${batchNumber}`, {
              executionId,
              batchNumber,
              elapsedMs: totalTimeMs,
              remainingMs: TIMEOUT_ABORT_MS - totalTimeMs,
              eventsProcessed
            })
          }
          
          if (totalTimeMs > TIMEOUT_ABORT_MS) {
            structuredLogger.error('timeout_abort_6month', `6-month update aborting at batch ${batchNumber} to prevent timeout`, {
              executionId,
              batchNumber,
              elapsedMs: totalTimeMs,
              eventsProcessed
            })
            
            throw new Error(`TIMEOUT_ABORT_6MONTH: Processed ${batchNumber} batches (${eventsProcessed} events) before timeout`)
          }
        }
      }

      structuredLogger.info('polymarket_6month_update_config', 'Using 6-month Polymarket update configuration', {
        executionId,
        config: {
          ...config,
          onBatchComplete: '[Function]' // Don't serialize the function
        }
      })

      try {
        const result = await updatePolymarketEventsAndMarketData(config)
        
        structuredLogger.info('polymarket_6month_update_completed', '6-month Polymarket data update completed successfully', {
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
        if (errorMessage.includes('TIMEOUT_ABORT_6MONTH')) {
          structuredLogger.info('polymarket_6month_update_partial', '6-month Polymarket data update completed partially due to timeout prevention', {
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
        
        structuredLogger.error('polymarket_6month_update_failed', '6-month Polymarket data update failed', {
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
      updateType: '6month-comprehensive',
      ...updateResult
    }
  }
)