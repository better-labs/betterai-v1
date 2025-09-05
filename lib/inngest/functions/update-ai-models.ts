/**
 * Inngest Scheduled Function: Update AI Models
 * Replaces Vercel cron with native Inngest scheduling
 * Runs weekly on Sunday at 4 AM to refresh available AI model list
 * 
 * Following Inngest best practices:
 * - Uses step functions for durable execution
 * - Implements proper error handling and logging
 * - Designed for reliability and observability
 */

import { inngest } from '../client'
import { updateAIModels } from '../../services/ai-models'
import { structuredLogger } from '../../utils/structured-logger'

/**
 * Update AI models - runs weekly on Sunday at 4 AM
 * Replaces: /api/cron/update-ai-models (schedule: "0 4 star star 0")
 */
export const updateAIModelsWeekly = inngest.createFunction(
  { 
    id: 'update-ai-models',
    name: 'OpenRouter Data Update: Refresh AI Models (Weekly Sunday 4 AM)',
    retries: 3,
  },
  { 
    cron: 'TZ=UTC 0 4 * * 0' // Weekly on Sunday at 4:00 AM UTC
  },
  async ({ step }) => {
    const executionId = `update-ai-models-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    structuredLogger.info('update_ai_models_started', 'Starting AI models update', {
      executionId,
      scheduledTime: new Date().toISOString()
    })

    // Step 1: Update AI models from OpenRouter
    const updateResult = await step.run('update-ai-models', async () => {
      try {
        const result = await updateAIModels()
        
        if (result.success) {
          structuredLogger.info('update_ai_models_completed', 'AI models update completed successfully', {
            executionId,
            totalFetched: result.totalFetched,
            totalUpserted: result.totalUpserted
          })
        } else {
          structuredLogger.error('update_ai_models_failed', 'AI models update failed', {
            executionId,
            error: {
              message: result.error || 'Unknown error'
            }
          })
          throw new Error(result.error)
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        structuredLogger.error('update_ai_models_error', 'AI models update error', {
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
      totalFetched: updateResult.totalFetched,
      totalUpserted: updateResult.totalUpserted
    }
  }
)