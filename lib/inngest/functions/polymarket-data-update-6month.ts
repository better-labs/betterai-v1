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
import { 
  createExecutionId, 
  createPolymarketConfig, 
  handleTimeoutError, 
  logUpdateCompletion, 
  logConfiguration 
} from '../utils/polymarket-update-helper'

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
    const executionId = createExecutionId('polymarket-6month')
    
    structuredLogger.info('polymarket_6month_update_started', 'Starting 6-month Polymarket data update', {
      executionId,
      scheduledTime: new Date().toISOString(),
      updateType: '6month-comprehensive'
    })

    // Step 1: Update Polymarket data with 6-month specific parameters
    const updateResult = await step.run('update-polymarket-6month-data', async () => {
      const config = createPolymarketConfig('POLYMARKET_6MONTH_UPDATE', {
        batchSize: 50,
        daysToFetchFuture: 180, // 6 months
        userAgent: 'BetterAI-6Month/1.0',
        sortBy: 'volume1yr', // Annual volume sorting
        maxEvents: 3000 // High event limit
      }, executionId, '6month')

      logConfiguration(config, executionId, 'polymarket_6month_update_config')

      try {
        const result = await updatePolymarketEventsAndMarketData(config)
        
        logUpdateCompletion(result, executionId, 'polymarket_6month_update_completed',
          '6-month Polymarket data update completed successfully')

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Handle timeout abort as partial success rather than failure
        const timeoutResult = handleTimeoutError(errorMessage, executionId, '6month')
        if (timeoutResult) {
          return timeoutResult
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