import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Prediction, NewPrediction, PredictionResult } from '@/lib/types'

export async function getPredictionsByMarketId(marketId: string): Promise<Prediction[]> {
  return await db.query.predictions.findMany({
    where: (predictions, { eq }) => eq(predictions.marketId, marketId),
    orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
  })
}

export async function getPredictionById(id: number): Promise<Prediction | null> {
  const result = await db.query.predictions.findFirst({
    where: (predictions, { eq }) => eq(predictions.id, id)
  })
  return result || null
}

export async function getRecentPredictions(limit: number = 50): Promise<Prediction[]> {
  return await db.query.predictions.findMany({
    orderBy: (predictions, { desc }) => [desc(predictions.createdAt)],
    limit
  })
}

export async function createPrediction(predictionData: NewPrediction): Promise<Prediction> {
  const [result] = await db.insert(predictions).values(predictionData).returning()
  return result
}

export async function updatePrediction(id: number, predictionData: Partial<NewPrediction>): Promise<Prediction | null> {
  const [result] = await db
    .update(predictions)
    .set(predictionData)
    .where(eq(predictions.id, id))
    .returning()
  return result || null
}

export async function deletePrediction(id: number): Promise<boolean> {
  const result = await db.delete(predictions).where(eq(predictions.id, id))
  return result.rowCount > 0
}

export async function getPredictionsByUserMessage(userMessage: string): Promise<Prediction[]> {
  return await db.query.predictions.findMany({
    where: (predictions, { eq }) => eq(predictions.userMessage, userMessage),
    orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
  })
}

export async function storePredictionResult(
  marketId: string,
  userMessage: string,
  predictionResult: PredictionResult,
  aiResponse?: string
): Promise<Prediction> {
  const predictionData: NewPrediction = {
    marketId,
    userMessage,
    predictionResult,
    aiResponse
  }
  
  return await createPrediction(predictionData)
}

export async function getMostRecentPredictionByMarketId(marketId: string): Promise<Prediction | null> {
  const result = await db.query.predictions.findFirst({
    where: (predictions, { eq }) => eq(predictions.marketId, marketId),
    orderBy: (predictions, { desc }) => [desc(predictions.createdAt)]
  })
  return result || null
} 