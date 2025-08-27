/**
 * Service for PredictionSession operations
 * - Follows service layer pattern with db parameter injection
 * - Support both PrismaClient and TransactionClient for atomic operations
 * - Returns DTOs, never raw Prisma models
 */

import { PrismaClient, PredictionSessionStatus } from '@/lib/generated/prisma'
import type { DbClient } from './types'

export interface PredictionSessionDTO {
  id: string
  userId: string
  marketId: string
  selectedModels: string[]
  status: PredictionSessionStatus
  step?: string | null
  error?: string | null
  createdAt: Date
  completedAt?: Date | null
  predictions: Array<{
    id: string
    modelName?: string | null
    predictionResult: any
    outcomes: string[]
    outcomesProbabilities: number[]
    aiResponse?: string | null
    createdAt?: Date | null
  }>
  market: {
    id: string
    question: string
    outcomes: string[]
  }
}

export interface CreatePredictionSessionInput {
  userId: string
  marketId: string
  selectedModels: string[]
}

/**
 * Create a new prediction session
 */
export async function createPredictionSession(
  db: DbClient,
  input: CreatePredictionSessionInput
): Promise<{ sessionId: string }> {
  const session = await db.predictionSession.create({
    data: {
      userId: input.userId,
      marketId: input.marketId,
      selectedModels: input.selectedModels,
      status: 'INITIALIZING'
    },
    select: {
      id: true
    }
  })

  return { sessionId: session.id }
}

/**
 * Get prediction session by ID with all related data
 */
export async function getPredictionSessionById(
  db: DbClient,
  sessionId: string,
  userId?: string
): Promise<PredictionSessionDTO | null> {
  const session = await db.predictionSession.findFirst({
    where: {
      id: sessionId,
      ...(userId && { userId }) // Ensure user can only access their own sessions
    },
    include: {
      predictions: {
        select: {
          id: true,
          modelName: true,
          predictionResult: true,
          outcomes: true,
          outcomesProbabilities: true,
          aiResponse: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      market: {
        select: {
          id: true,
          question: true,
          outcomes: true
        }
      }
    }
  })

  if (!session) {
    return null
  }

  return {
    id: session.id,
    userId: session.userId,
    marketId: session.marketId,
    selectedModels: session.selectedModels,
    status: session.status,
    step: session.step,
    error: session.error,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    predictions: session.predictions.map(pred => ({
      id: String(pred.id),
      modelName: pred.modelName,
      predictionResult: pred.predictionResult,
      outcomes: pred.outcomes,
      outcomesProbabilities: pred.outcomesProbabilities?.map(p => Number(p)) || [],
      aiResponse: pred.aiResponse,
      createdAt: pred.createdAt
    })),
    market: session.market
  }
}

/**
 * Update prediction session status and step
 */
export async function updatePredictionSession(
  db: DbClient,
  sessionId: string,
  updates: {
    status?: PredictionSessionStatus
    step?: string | null
    error?: string | null
    completedAt?: Date | null
  }
): Promise<void> {
  await db.predictionSession.update({
    where: { id: sessionId },
    data: {
      ...updates,
      ...(updates.status === 'FINISHED' && !updates.completedAt && { completedAt: new Date() })
    }
  })
}

/**
 * Check if user has sufficient credits for selected models
 */
export async function validateCreditsForSession(
  db: DbClient,
  userId: string,
  modelCount: number
): Promise<{ hasCredits: boolean; currentCredits: number; required: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  const required = modelCount // 1 credit per model
  const hasCredits = user.credits >= required

  return {
    hasCredits,
    currentCredits: user.credits,
    required
  }
}

/**
 * Get user's recent sessions for a market (last 24h)
 */
export async function getUserRecentSessions(
  db: DbClient,
  userId: string,
  marketId: string
): Promise<Array<{ id: string; createdAt: Date; status: PredictionSessionStatus }>> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const sessions = await db.predictionSession.findMany({
    where: {
      userId,
      marketId,
      createdAt: {
        gte: yesterday
      }
    },
    select: {
      id: true,
      createdAt: true,
      status: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  return sessions
}