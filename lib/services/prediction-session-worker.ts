/**
 * Prediction Session Worker - Sequential model execution
 * Executes predictions for a session and manages status updates
 */

import type { DbClient } from './types'
import { generatePredictionForMarket } from './generate-single-prediction'
import { updatePredictionSession, getPredictionSessionById } from './prediction-session-service'
import { creditManager } from './credit-manager'
import * as predictionService from './prediction-service'
import { structuredLogger } from '../utils/structured-logger'

export interface WorkerResult {
  success: boolean
  totalModels: number
  successCount: number
  failureCount: number
  error?: string
}

/**
 * Execute predictions for all models in a session
 * Follows Phase 3 flow from TODO.md
 */
export async function executePredictionSession(
  db: DbClient,
  sessionId: string
): Promise<WorkerResult> {
  try {
    // Get session data
    const session = await getPredictionSessionById(db, sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    if (session.status !== 'INITIALIZING') {
      throw new Error(`Session ${sessionId} is not in INITIALIZING state: ${session.status}`)
    }

    const { selectedModels, userId, marketId } = session
    let successCount = 0
    let failureCount = 0

    // Log session processing start
    structuredLogger.info('prediction_session_worker_started', `Starting worker for session ${sessionId}`, {
      sessionId,
      userId,
      marketId,
      modelCount: selectedModels.length,
      selectedModels
    })

    const startTime = Date.now()

    // Step 1: Optional research phase (skipped for v1 simplicity)
    await updatePredictionSession(db, sessionId, {
      status: 'GENERATING',
      step: 'Starting prediction generation'
    })

    // Step 2: Process each model sequentially
    for (let i = 0; i < selectedModels.length; i++) {
      const modelName = selectedModels[i]
      const modelStartTime = Date.now()

      try {
        // Log model processing start
        structuredLogger.predictionSessionModelProcessing(sessionId, modelName, 'generating')

        // Update step to show current model
        await updatePredictionSession(db, sessionId, {
          step: `Generating prediction ${i + 1}/${selectedModels.length} with ${modelName}`
        })

        // Generate prediction using existing service
        const result = await generatePredictionForMarket(
          marketId,
          userId,
          modelName,
          undefined, // additionalUserMessageContext
          undefined, // experimentTag  
          undefined  // experimentNotes
        )

        if (result.success && result.predictionId) {
          // Link prediction to session
          await db.prediction.update({
            where: { id: result.predictionId },
            data: { sessionId }
          })

          successCount++
          const modelDuration = Date.now() - modelStartTime
          structuredLogger.predictionSessionModelCompleted(sessionId, modelName, true, modelDuration)
        } else {
          failureCount++
          const modelDuration = Date.now() - modelStartTime
          structuredLogger.predictionSessionModelCompleted(sessionId, modelName, false, modelDuration)
        }

      } catch (error) {
        failureCount++
        const modelDuration = Date.now() - modelStartTime
        structuredLogger.predictionSessionModelCompleted(sessionId, modelName, false, modelDuration)

        // Log the error with context
        if (error instanceof Error) {
          structuredLogger.error('prediction_session_model_error', `Model ${modelName} failed with error`, {
            sessionId,
            modelName,
            error: {
              message: error.message,
              stack: error.stack
            },
            duration: modelDuration
          })
        }
      }
    }

    // Step 3: Handle final session state
    const totalDuration = Date.now() - startTime

    if (successCount === 0) {
      // All models failed - refund credits and mark as error
      try {
        await creditManager.refundCredits(
          db,
          userId,
          selectedModels.length,
          `All models failed for session ${sessionId}`,
          { marketId }
        )

        await updatePredictionSession(db, sessionId, {
          status: 'ERROR',
          step: 'All models failed - credits refunded',
          error: `All ${selectedModels.length} models failed to generate predictions`
        })

        // Log session completion with error
        structuredLogger.predictionSessionCompleted(sessionId, 'ERROR', successCount, failureCount, totalDuration)
        structuredLogger.info('prediction_session_credits_refunded', `Refunded ${selectedModels.length} credits for failed session`, {
          sessionId,
          userId,
          creditsRefunded: selectedModels.length,
          reason: 'all_models_failed'
        })

      } catch (refundError) {
        // Log refund failure
        if (refundError instanceof Error) {
          structuredLogger.error('prediction_session_refund_failed', 'Failed to refund credits for failed session', {
            sessionId,
            userId,
            error: {
              message: refundError.message,
              stack: refundError.stack
            }
          })
        }

        await updatePredictionSession(db, sessionId, {
          status: 'ERROR',
          error: `All models failed and credit refund failed: ${refundError instanceof Error ? refundError.message : 'Unknown error'}`
        })
      }
    } else {
      // At least one model succeeded - mark as finished
      await updatePredictionSession(db, sessionId, {
        status: 'FINISHED',
        step: `Completed ${successCount}/${selectedModels.length} predictions`,
        completedAt: new Date()
      })

      // Log successful session completion
      structuredLogger.predictionSessionCompleted(sessionId, 'FINISHED', successCount, failureCount, totalDuration)
    }

    return {
      success: true,
      totalModels: selectedModels.length,
      successCount,
      failureCount
    }

  } catch (error) {
    // Log structured error
    if (error instanceof Error) {
      structuredLogger.predictionSessionError(
        sessionId,
        'unknown', // userId not available in this context
        error,
        { step: 'worker_execution' }
      )
    }

    // Update session to error state
    try {
      await updatePredictionSession(db, sessionId, {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown worker error'
      })
    } catch (updateError) {
      // Log update error as well
      if (updateError instanceof Error) {
        structuredLogger.error('prediction_session_update_failed', 'Failed to update session to error state', {
          sessionId,
          error: {
            message: updateError.message,
            stack: updateError.stack
          }
        })
      }
    }

    return {
      success: false,
      totalModels: 0,
      successCount: 0,
      failureCount: 0,
      error: error instanceof Error ? error.message : 'Unknown worker error'
    }
  }
}

/**
 * Execute prediction session with retry logic
 * Implements exponential backoff (3 attempts max)
 */
export async function executePredictionSessionWithRetry(
  db: DbClient,
  sessionId: string,
  maxAttempts: number = 3
): Promise<WorkerResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await executePredictionSession(db, sessionId)
      
      if (result.success) {
        return result
      }
      
      // If we got a result but it wasn't successful, don't retry
      if (result.successCount > 0 || result.failureCount > 0) {
        return result
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.log(`Attempt ${attempt}/${maxAttempts} failed for session ${sessionId}:`, lastError.message)
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
        console.log(`Retrying session ${sessionId} in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All attempts failed
  const errorMessage = `Worker failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  
  try {
    await updatePredictionSession(db, sessionId, {
      status: 'ERROR',
      error: errorMessage
    })
  } catch (updateError) {
    console.error(`Failed to update session ${sessionId} after retry failures:`, updateError)
  }

  return {
    success: false,
    totalModels: 0,
    successCount: 0,
    failureCount: 0,
    error: errorMessage
  }
}