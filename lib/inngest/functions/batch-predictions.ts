/**
 * Inngest Scheduled Function: Batch Prediction Generation
 * Native cron-scheduled function - no events or API endpoints needed
 * Runs daily at 6 AM UTC to generate predictions for trending markets
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { 
  runBatchPredictionGeneration, 
  type BatchPredictionConfig 
} from '../../services/generate-batch-predictions'
import { sendHeartbeatSafe, HeartbeatType } from '../../services/heartbeat'
import { structuredLogger } from '../../utils/structured-logger'
import { Category } from '../../generated/prisma'

/**
 * Daily batch prediction generation - scheduled function
 * Replaces Vercel cron completely with native Inngest scheduling
 */
export const dailyBatchPredictions = inngest.createFunction(
  { 
    id: 'daily-batch-predictions',
    name: 'Generate Batch Predictions (Daily)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 0 6 * * *' // Daily at 6:00 AM UTC
  },
  async ({ step }) => {
    const executionId = `scheduled-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('scheduled_batch_predictions_started', 'Starting scheduled batch prediction job', {
      executionId,
      scheduledTime: new Date().toISOString()
    })

    // Step 1: Get model list and prepare configuration
    const { config, modelNames } = await step.run('prepare-config', async () => {
      // Import AI models configuration
      const { getModelIds } = await import('@/lib/config/ai-models')
      const modelList = getModelIds()
      
      // Use default configuration for scheduled runs
      const defaultConfig: BatchPredictionConfig = {
        topMarketsCount: 5, // Conservative default for scheduled runs
        endDateRangeHours: 48, // 48-hour window around target date
        targetDaysFromNow: 7, // Look at markets ending ~1 week from now
        excludeCategories: [Category.CRYPTOCURRENCY],
        concurrencyPerModel: 3, // Safe concurrency for scheduled runs
      }

      return {
        config: defaultConfig,
        modelNames: modelList
      }
    })

    // Step 2: Process each model sequentially with error isolation
    const results = []
    
    for (const modelName of modelNames) {
      const modelResult = await step.run(`process-model-${modelName}`, async () => {
        try {
          structuredLogger.info('scheduled_batch_model_started', `Starting scheduled batch predictions for ${modelName}`, {
            executionId,
            modelName,
            config
          })

          // Run batch prediction for this specific model
          await runBatchPredictionGeneration(config, modelName, {
            experimentTag: 'inngest-scheduled',
            experimentNotes: `Scheduled batch job ${executionId}`
          })

          structuredLogger.info('scheduled_batch_model_completed', `Completed scheduled batch predictions for ${modelName}`, {
            executionId,
            modelName,
            success: true
          })

          return { modelName, success: true, error: null }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          structuredLogger.error('scheduled_batch_model_failed', `Scheduled batch predictions failed for ${modelName}`, {
            executionId,
            modelName,
            error: {
              message: errorMessage,
              stack: error instanceof Error ? error.stack : undefined
            }
          })

          return { modelName, success: false, error: errorMessage }
        }
      })

      results.push(modelResult)
    }

    // Step 3: Send heartbeat and log completion
    await step.run('send-heartbeat', async () => {
      await sendHeartbeatSafe(HeartbeatType.BATCH_PREDICTIONS)
    })

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    structuredLogger.info('scheduled_batch_predictions_completed', 'Scheduled batch prediction job completed', {
      executionId,
      totalModels: modelNames.length,
      successCount,
      failureCount,
      results,
      completedAt: new Date().toISOString()
    })

    return {
      success: true,
      executionId,
      totalModels: modelNames.length,
      successCount,
      failureCount,
      results,
      scheduledExecution: true
    }
  }
)