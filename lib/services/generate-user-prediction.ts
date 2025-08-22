import { marketQueries, DEFAULT_MODEL } from '../db/queries'
import { generatePredictionForMarket } from './generate-single-prediction'
import type { UserPredictionRequest, PredictionSession, PredictionResult, ModelProvider } from '../types'
import { USER_MESSAGE_PREFIX } from '@/lib/utils'

export const SUPPORTED_MODELS: ModelProvider[] = [
  { id: 'google/gemini-2.5-pro', name: 'Google Gemini', description: 'Advanced reasoning', costCredits: 1 },
  { id: 'openai/gpt-5', name: 'OpenAI GPT-5', description: 'Latest OpenAI model', costCredits: 1 },
  { id: 'anthropic/claude-sonnet-4', name: 'Anthropic Claude', description: 'Thoughtful analysis', costCredits: 1 },
  { id: 'x-ai/grok-4', name: 'xAI Grok', description: 'Real-time aware', costCredits: 1 },
  { id: 'qwen3-235b-a22b-instruct-2507', name: 'Alibaba Qwen', description: 'Multilingual capability', costCredits: 1 }
]

// In-memory session storage (will be enhanced with Redis later)
const predictionSessions = new Map<string, PredictionSession>()

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getSession(sessionId: string): PredictionSession | undefined {
  return predictionSessions.get(sessionId)
}

export function updateSession(sessionId: string, updates: Partial<PredictionSession>): void {
  const session = predictionSessions.get(sessionId)
  if (session) {
    const updatedSession = { ...session, ...updates, updatedAt: new Date().toISOString() }
    predictionSessions.set(sessionId, updatedSession)
  }
}

export async function initiatePredictionSession(request: UserPredictionRequest): Promise<PredictionSession> {
  const session: PredictionSession = {
    id: request.sessionId,
    marketId: request.marketId,
    userId: request.userId,
    selectedModels: request.selectedModels,
    status: 'initializing',
    progress: 0,
    completedModels: [],
    results: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  predictionSessions.set(request.sessionId, session)
  
  // Start the prediction generation process
  generateMultiModelPredictions(request).catch(error => {
    console.error('Error in prediction generation:', error)
    updateSession(request.sessionId, {
      status: 'error',
      error: error.message || 'Unknown error occurred'
    })
  })

  return session
}

async function generateMultiModelPredictions(request: UserPredictionRequest): Promise<void> {
  const { sessionId, marketId, userId, selectedModels } = request
  
  try {
    // Update to researching phase
    updateSession(sessionId, {
      status: 'researching',
      currentStep: 'Gathering market research data',
      progress: 10
    })

    // Validate market exists
    const market = await marketQueries.getMarketById(marketId)
    if (!market) {
      throw new Error(`Market with ID ${marketId} not found`)
    }

    // Simulate research phase (this will later integrate with market-research-service)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update to predicting phase
    updateSession(sessionId, {
      status: 'predicting',
      currentStep: 'Generating predictions from AI models',
      progress: 20
    })

    const totalModels = selectedModels.length
    const results: { [modelId: string]: PredictionResult } = {}
    const completedModels: string[] = []

    // Process each model sequentially to avoid rate limits
    for (let i = 0; i < selectedModels.length; i++) {
      const modelId = selectedModels[i]
      const progressPercent = 20 + ((i / totalModels) * 70) // 20-90% range

      updateSession(sessionId, {
        currentStep: `Predicting with ${getModelName(modelId)}`,
        progress: progressPercent
      })

      try {
        // Use existing single prediction service with specific model
        const predictionResponse = await generatePredictionForMarket(
          marketId,
          userId,
          modelId,
          undefined, // No additional context for now
          'user-prediction-builder', // experiment tag
          `Multi-model prediction session: ${sessionId}`
        )

        if (predictionResponse.success && predictionResponse.prediction) {
          results[modelId] = predictionResponse.prediction
          completedModels.push(modelId)
          
          updateSession(sessionId, {
            completedModels: [...completedModels],
            results: { ...results },
            progress: 20 + (((i + 1) / totalModels) * 70)
          })
        } else {
          console.error(`Failed to generate prediction for model ${modelId}:`, predictionResponse.message)
          // Continue with other models even if one fails
        }
      } catch (error) {
        console.error(`Error generating prediction for model ${modelId}:`, error)
        // Continue with other models even if one fails
      }

      // Add delay between models to respect rate limits
      if (i < selectedModels.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Mark as completed
    updateSession(sessionId, {
      status: 'completed',
      currentStep: 'All predictions completed',
      progress: 100,
      results
    })

  } catch (error) {
    console.error('Error in multi-model prediction generation:', error)
    updateSession(sessionId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

function getModelName(modelId: string): string {
  const model = SUPPORTED_MODELS.find(m => m.id === modelId)
  return model ? model.name : modelId
}

export function calculateTotalCredits(selectedModels: string[]): number {
  return selectedModels.reduce((total, modelId) => {
    const model = SUPPORTED_MODELS.find(m => m.id === modelId)
    return total + (model ? model.costCredits : 1)
  }, 0)
}

export function cleanupOldSessions(): void {
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
  
  for (const [sessionId, session] of predictionSessions.entries()) {
    const sessionTime = new Date(session.createdAt).getTime()
    if (sessionTime < twentyFourHoursAgo) {
      predictionSessions.delete(sessionId)
    }
  }
}

export function getAllSessions(): Map<string, PredictionSession> {
  return predictionSessions
}

export function getSessionsByUser(userId: string): PredictionSession[] {
  const userSessions: PredictionSession[] = []
  for (const session of predictionSessions.values()) {
    if (session.userId === userId) {
      userSessions.push(session)
    }
  }
  return userSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function deleteSession(sessionId: string): boolean {
  return predictionSessions.delete(sessionId)
}

export function getSessionStats() {
  const totalSessions = predictionSessions.size
  const completedSessions = Array.from(predictionSessions.values()).filter(s => s.status === 'completed').length
  const errorSessions = Array.from(predictionSessions.values()).filter(s => s.status === 'error').length
  const activeSessions = totalSessions - completedSessions - errorSessions
  
  return {
    total: totalSessions,
    active: activeSessions,
    completed: completedSessions,
    error: errorSessions
  }
}

// Clean up old sessions every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000)