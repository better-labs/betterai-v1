/**
 * Service for PredictionSession operations
 * - Follows service layer pattern with db parameter injection
 * - Support both PrismaClient and TransactionClient for atomic operations
 * - Returns DTOs, never raw Prisma models
 */

import { PrismaClient, PredictionSessionStatus } from '@/lib/generated/prisma'
import type { DbClient } from './types'
import { inngest } from '@/lib/inngest/client'
import { structuredLogger } from '@/lib/utils/structured-logger'

export interface PredictionSessionDTO {
  id: string
  userId: string
  marketId: string
  selectedModels: string[]
  selectedResearchSources?: string[]
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

export interface CreatePredictionSessionWithInngestInput extends CreatePredictionSessionInput {
  useInngest?: boolean
}


/**
 * Create a new prediction session with Inngest integration
 * Uses event-driven architecture for reliable processing
 */
export async function createPredictionSession(
  db: DbClient,
  input: CreatePredictionSessionWithInngestInput
): Promise<{ sessionId: string }> {
  const { useInngest = false, ...sessionData } = input
  
  const session = await db.predictionSession.create({
    data: {
      userId: sessionData.userId,
      marketId: sessionData.marketId,
      selectedModels: sessionData.selectedModels,
      status: useInngest ? 'QUEUED' : 'INITIALIZING'
    },
    select: {
      id: true
    }
  })

  // If using Inngest, send event to trigger processing
  if (useInngest) {
    try {
      await inngest.send({
        name: 'prediction.session.requested',
        data: {
          sessionId: session.id,
          userId: sessionData.userId,
          marketId: sessionData.marketId,
          selectedModels: sessionData.selectedModels
        }
      })

      structuredLogger.info('prediction_session_inngest_event_sent', `Inngest event sent for session ${session.id}`, {
        sessionId: session.id,
        userId: sessionData.userId,
        marketId: sessionData.marketId,
        modelCount: sessionData.selectedModels.length
      })
    } catch (error) {
      // If Inngest event fails, update session to ERROR state
      await db.predictionSession.update({
        where: { id: session.id },
        data: {
          status: 'ERROR',
          error: `Failed to queue Inngest event: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      })

      if (error instanceof Error) {
        structuredLogger.error('prediction_session_inngest_event_failed', `Failed to send Inngest event for session ${session.id}`, {
          sessionId: session.id,
          userId: sessionData.userId,
          error: {
            message: error.message,
            stack: error.stack
          }
        })
      }

      throw new Error(`Failed to queue prediction session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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
      },
      researchCache: {
        include: {
          researchCache: {
            select: {
              source: true
            }
          }
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
    selectedResearchSources: session.researchCache.map(rc => rc.researchCache.source).filter((v, i, a) => a.indexOf(v) === i), // Unique sources
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

/**
 * Send recovery event for stuck sessions
 * Used by session recovery service
 */
export async function sendRecoveryEvent(
  sessionId: string,
  reason: string = 'manual_recovery'
): Promise<void> {
  try {
    await inngest.send({
      name: 'prediction.session.recovery',
      data: {
        sessionId,
        reason
      }
    })

    structuredLogger.info('prediction_session_recovery_event_sent', `Recovery event sent for session ${sessionId}`, {
      sessionId,
      reason
    })
  } catch (error) {
    if (error instanceof Error) {
      structuredLogger.error('prediction_session_recovery_event_failed', `Failed to send recovery event for session ${sessionId}`, {
        sessionId,
        reason,
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    }

    throw new Error(`Failed to send recovery event: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}