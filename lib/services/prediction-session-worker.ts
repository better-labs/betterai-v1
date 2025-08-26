/**
 * Prediction Session Worker - Sequential model execution
 * Executes predictions for a session and manages status updates
 */

import type { DbClient } from './types'
import { generatePredictionForMarket } from './generate-single-prediction'
import { updatePredictionSession, getPredictionSessionById } from './prediction-session-service'
import { creditManager } from './credit-manager'
import * as predictionService from './prediction-service'

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

    // Step 1: Optional research phase (skipped for v1 simplicity)
    await updatePredictionSession(db, sessionId, {
      status: 'GENERATING',
      step: 'Starting prediction generation'
    })

    // Step 2: Process each model sequentially
    for (let i = 0; i < selectedModels.length; i++) {
      const modelName = selectedModels[i]
      
      try {
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
          console.log(`✅ Model ${modelName} succeeded for session ${sessionId}`)
        } else {
          failureCount++
          console.log(`❌ Model ${modelName} failed for session ${sessionId}: ${result.message}`)
        }

      } catch (error) {
        failureCount++
        console.error(`❌ Model ${modelName} error for session ${sessionId}:`, error)
      }
    }

    // Step 3: Handle final session state
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

        console.log(`💰 Refunded ${selectedModels.length} credits for session ${sessionId} - all models failed`)
      } catch (refundError) {
        console.error(`Failed to refund credits for session ${sessionId}:`, refundError)
        
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

      console.log(`✅ Session ${sessionId} completed: ${successCount} success, ${failureCount} failures`)
    }

    return {
      success: true,
      totalModels: selectedModels.length,
      successCount,
      failureCount
    }

  } catch (error) {
    console.error(`❌ Worker error for session ${sessionId}:`, error)
    
    // Update session to error state
    try {
      await updatePredictionSession(db, sessionId, {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown worker error'
      })
    } catch (updateError) {
      console.error(`Failed to update session ${sessionId} to error state:`, updateError)
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