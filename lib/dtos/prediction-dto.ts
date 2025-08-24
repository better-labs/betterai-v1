import { serializeDecimals } from "@/lib/serialization"
import type { Prediction } from "@/lib/generated/prisma"
import type { PredictionDTO } from "@/lib/types"
import { toNumberOrNull } from "@/lib/utils"

/**
 * Convert raw Prisma Prediction model to serialized DTO safe for Client Components
 */
export function mapPredictionToDTO(prediction: Prediction): PredictionDTO {
  const serialized = serializeDecimals(prediction) as any
  
  return {
    id: String(serialized.id),
    userMessage: serialized.userMessage,
    marketId: serialized.marketId,
    predictionResult: serialized.predictionResult,
    modelName: serialized.modelName ?? null,
    systemPrompt: serialized.systemPrompt ?? null,
    aiResponse: serialized.aiResponse ?? null,
    createdAt: serialized.createdAt,
    outcomes: Array.isArray(serialized.outcomes) ? serialized.outcomes : [],
    outcomesProbabilities: Array.isArray(serialized.outcomesProbabilities) 
      ? serialized.outcomesProbabilities.map((prob: unknown) => toNumberOrNull(prob) ?? 0) 
      : [],
    userId: serialized.userId ?? null,
    experimentTag: serialized.experimentTag ?? null,
    experimentNotes: serialized.experimentNotes ?? null,
  }
}

/**
 * Convert array of Prisma Prediction models to DTOs
 */
export function mapPredictionsToDTO(predictions: Prediction[]): PredictionDTO[] {
  const serialized = serializeDecimals(predictions) as any[]
  
  return serialized.map((prediction) => ({
    id: String(prediction.id),
    userMessage: prediction.userMessage,
    marketId: prediction.marketId,
    predictionResult: prediction.predictionResult,
    modelName: prediction.modelName ?? null,
    systemPrompt: prediction.systemPrompt ?? null,
    aiResponse: prediction.aiResponse ?? null,
    createdAt: prediction.createdAt,
    outcomes: Array.isArray(prediction.outcomes) ? prediction.outcomes : [],
    outcomesProbabilities: Array.isArray(prediction.outcomesProbabilities) 
      ? prediction.outcomesProbabilities.map((prob: unknown) => toNumberOrNull(prob) ?? 0) 
      : [],
    userId: prediction.userId ?? null,
    experimentTag: prediction.experimentTag ?? null,
    experimentNotes: prediction.experimentNotes ?? null,
  }))
}