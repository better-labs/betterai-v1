/**
 * Inngest Scheduled Function: Prediction Check
 * Replaces Vercel cron with native Inngest scheduling
 * Runs daily at 3:30 AM to validate and score existing predictions
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { generatePredictionVsMarketDelta } from '../../services/prediction-checker'
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Prediction check - runs daily at 3:30 AM
 * Replaces: /api/cron/prediction-check (schedule: "30 3 star star star")
 */
export const predictionCheck = inngest.createFunction(
  { 
    id: 'prediction-check',
    name: 'Prediction Check (Daily 3:30 AM)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 30 3 * * *' // Daily at 3:30 AM UTC
  },
  async ({ step }) => {
    const executionId = `prediction-check-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('prediction_check_started', 'Starting prediction check', {
      executionId,
      scheduledTime: new Date().toISOString()
    })

    // Step 1: Run prediction vs market delta check
    const checkResult = await step.run('check-predictions', async () => {
      const config = {
        daysLookback: Number(process.env.PREDICTION_CHECK_LOOKBACK_DAYS ?? 30),
        maxPredictions: 200, // Conservative default
        includeClosedMarkets: false,
        excludeCategories: [] as string[]
      }

      structuredLogger.info('prediction_check_config', 'Using prediction check configuration', {
        executionId,
        config
      })

      try {
        const result = await generatePredictionVsMarketDelta(config)
        
        structuredLogger.info('prediction_check_completed', 'Prediction check completed successfully', {
          executionId,
          checkedCount: result.checkedCount,
          savedCount: result.savedCount
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('prediction_check_failed', 'Prediction check failed', {
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
      await sendHeartbeatSafe(HeartbeatType.PREDICTION_CHECK)
    })

    return {
      success: true,
      executionId,
      checkedCount: checkResult.checkedCount,
      savedCount: checkResult.savedCount
    }
  }
)