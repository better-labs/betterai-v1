import { serializeDecimals } from "@/lib/serialization"
import type { PredictionCheck } from "@/lib/generated/prisma"
import type { PredictionCheckDTO } from "@/lib/types"
import { toNumberOrNull } from "@/lib/utils"

/**
 * Convert raw Prisma PredictionCheck model to serialized DTO safe for Client Components
 */
export function mapPredictionCheckToDTO(predictionCheck: PredictionCheck): PredictionCheckDTO {
  const serialized = serializeDecimals(predictionCheck) as any
  
  return {
    id: String(serialized.id),
    predictionId: serialized.predictionId == null ? null : String(serialized.predictionId),
    marketId: serialized.marketId ?? null,
    aiProbability: toNumberOrNull(serialized.aiProbability),
    marketProbability: toNumberOrNull(serialized.marketProbability),
    delta: toNumberOrNull(serialized.delta),
    absDelta: toNumberOrNull(serialized.absDelta),
    marketClosed: serialized.marketClosed ?? null,
    createdAt: typeof serialized.createdAt === 'string' ? serialized.createdAt : new Date(serialized.createdAt).toISOString(),
  }
}

/**
 * Convert array of Prisma PredictionCheck models to DTOs
 */
export function mapPredictionChecksToDTO(predictionChecks: PredictionCheck[]): PredictionCheckDTO[] {
  const serialized = serializeDecimals(predictionChecks) as any[]
  
  return serialized.map((check) => ({
    id: String(check.id),
    predictionId: check.predictionId == null ? null : String(check.predictionId),
    marketId: check.marketId ?? null,
    aiProbability: toNumberOrNull(check.aiProbability),
    marketProbability: toNumberOrNull(check.marketProbability),
    delta: toNumberOrNull(check.delta),
    absDelta: toNumberOrNull(check.absDelta),
    marketClosed: check.marketClosed ?? null,
    createdAt: typeof check.createdAt === 'string' ? check.createdAt : new Date(check.createdAt).toISOString(),
  }))
}