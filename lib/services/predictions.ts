import { PrismaClient, Prisma } from '@/lib/generated/prisma'
import { serializeDecimals } from '@/lib/serialization'
import type { PredictionDTO } from '@/lib/types'

// Type for Prisma client or transaction
type PrismaContext = PrismaClient | Prisma.TransactionClient

/**
 * Search predictions with filtering and pagination
 */
export async function searchPredictions(
  db: PrismaContext,
  params: {
    userId?: string
    marketId?: string
    modelName?: string
    experimentTag?: string
    confidenceLevel?: 'High' | 'Medium' | 'Low'
    limit?: number
    page?: number
    sortBy?: 'createdAt' | 'confidence'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<PredictionDTO[]> {
  const {
    userId,
    marketId,
    modelName,
    experimentTag,
    confidenceLevel,
    limit = 20,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  const where: Prisma.PredictionWhereInput = {
    ...(userId && { userId }),
    ...(marketId && { marketId }),
    ...(modelName && { modelName }),
    ...(experimentTag && { experimentTag }),
    // Note: confidenceLevel filtering would require JSON path queries
    // Simplified for now - would need proper JSON filtering
  }

  const orderBy: Prisma.PredictionOrderByWithRelationInput = {
    [sortBy === 'createdAt' ? 'createdAt' : 'createdAt']: sortOrder // Simplified sorting
  }

  const skip = (page - 1) * limit

  const predictions = await db.prediction.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    include: {
      market: {
        select: {
          id: true,
          question: true,
          outcomes: true,
          active: true,
        }
      }
    }
  })

  return predictions.map(prediction => {
    const serialized = serializeDecimals(prediction) as any
    return {
      id: String(serialized.id),
      userMessage: serialized.userMessage,
      marketId: serialized.marketId,
      predictionResult: serialized.predictionResult,
      modelName: serialized.modelName || null,
      systemPrompt: serialized.systemPrompt || null,
      aiResponse: serialized.aiResponse || null,
      createdAt: serialized.createdAt.toISOString(),
      outcomes: serialized.outcomes,
      outcomesProbabilities: serialized.outcomesProbabilities,
      userId: serialized.userId || null,
      experimentTag: serialized.experimentTag || null,
      experimentNotes: serialized.experimentNotes || null,
      market: serialized.market ? {
        id: serialized.market.id,
        question: serialized.market.question,
        outcomes: serialized.market.outcomes,
        active: serialized.market.active,
      } : undefined
    } as PredictionDTO & { market?: any }
  })
}

/**
 * Get recent predictions for a user
 */
export async function getRecentPredictions(
  db: PrismaContext,
  userId: string,
  limit = 10
): Promise<PredictionDTO[]> {
  return searchPredictions(db, {
    userId,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
}

/**
 * Get predictions for a specific market
 */
export async function getPredictionsByMarket(
  db: PrismaContext,
  marketId: string,
  limit = 20
): Promise<PredictionDTO[]> {
  return searchPredictions(db, {
    marketId,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
}

/**
 * Get prediction by ID
 */
export async function getPredictionById(
  db: PrismaContext,
  id: string
): Promise<(PredictionDTO & { market?: any }) | null> {
  try {
    const predictionId = parseInt(id, 10)
    if (isNaN(predictionId)) return null

    const prediction = await db.prediction.findUnique({
      where: { id: predictionId },
      include: {
        market: {
          select: {
            id: true,
            question: true,
            outcomes: true,
            active: true,
            event: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    })

    if (!prediction) return null

    const serialized = serializeDecimals(prediction) as any
    return {
      id: String(serialized.id),
      userMessage: serialized.userMessage,
      marketId: serialized.marketId,
      predictionResult: serialized.predictionResult,
      modelName: serialized.modelName || null,
      systemPrompt: serialized.systemPrompt || null,
      aiResponse: serialized.aiResponse || null,
      createdAt: serialized.createdAt.toISOString(),
      outcomes: serialized.outcomes,
      outcomesProbabilities: serialized.outcomesProbabilities,
      userId: serialized.userId || null,
      experimentTag: serialized.experimentTag || null,
      experimentNotes: serialized.experimentNotes || null,
      market: serialized.market ? {
        id: serialized.market.id,
        question: serialized.market.question,
        outcomes: serialized.market.outcomes,
        active: serialized.market.active,
        event: serialized.market.event
      } : undefined
    }
  } catch (error) {
    console.error('Error fetching prediction by ID:', error)
    return null
  }
}

/**
 * Create new prediction (authenticated users only)
 * This is a simplified wrapper - the actual prediction generation
 * should use the existing generate-single-prediction service
 */
export async function createPrediction(
  db: PrismaContext,
  userId: string,
  data: {
    marketId: string
    userMessage: string
    model?: string
    dataSources?: string[]
    experimentTag?: string
    experimentNotes?: string
  }
): Promise<PredictionDTO> {
  // This is a placeholder - in reality, this should delegate to
  // the existing generate-single-prediction service which handles
  // AI model calls, credit checking, etc.
  
  try {
    const prediction = await db.prediction.create({
      data: {
        marketId: data.marketId,
        userMessage: data.userMessage,
        userId: userId,
        modelName: data.model || null,
        experimentTag: data.experimentTag || null,
        experimentNotes: data.experimentNotes || null,
        createdAt: new Date(),
        // Placeholder values - should be generated by AI
        predictionResult: {
          prediction: "Analysis pending...",
          outcomes: [],
          outcomesProbabilities: [],
          reasoning: "Generating prediction...",
          confidence_level: "Medium"
        },
        outcomes: [],
        outcomesProbabilities: [],
        aiResponse: null,
        systemPrompt: null,
      },
      include: {
        market: {
          select: {
            id: true,
            question: true,
            outcomes: true,
            active: true,
          }
        }
      }
    })

    const serialized = serializeDecimals(prediction) as any
    return {
      id: String(serialized.id),
      userMessage: serialized.userMessage,
      marketId: serialized.marketId,
      predictionResult: serialized.predictionResult,
      modelName: serialized.modelName || null,
      systemPrompt: serialized.systemPrompt || null,
      aiResponse: serialized.aiResponse || null,
      createdAt: serialized.createdAt.toISOString(),
      outcomes: serialized.outcomes,
      outcomesProbabilities: serialized.outcomesProbabilities,
      userId: serialized.userId || null,
      experimentTag: serialized.experimentTag || null,
      experimentNotes: serialized.experimentNotes || null,
      market: serialized.market ? {
        id: serialized.market.id,
        question: serialized.market.question,
        outcomes: serialized.market.outcomes,
        active: serialized.market.active,
      } : undefined
    } as PredictionDTO & { market?: any }
  } catch (error) {
    console.error('Error creating prediction:', error)
    throw new Error('Failed to create prediction')
  }
}

/**
 * Get user's prediction statistics
 */
export async function getUserPredictionStats(
  db: PrismaContext,
  userId: string
): Promise<{
  totalPredictions: number
  totalAccuracy?: number
  highConfidenceCount: number
  mediumConfidenceCount: number
  lowConfidenceCount: number
}> {
  try {
    const predictions = await db.prediction.findMany({
      where: { userId },
      select: {
        id: true,
        predictionResult: true,
      }
    })

    const stats = predictions.reduce((acc, p) => {
      const result = p.predictionResult as any
      const confidence = result?.confidence_level
      
      if (confidence === 'High') acc.highConfidenceCount++
      else if (confidence === 'Medium') acc.mediumConfidenceCount++
      else if (confidence === 'Low') acc.lowConfidenceCount++
      
      return acc
    }, {
      totalPredictions: predictions.length,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
    })

    return stats
  } catch (error) {
    console.error('Error fetching user prediction stats:', error)
    return {
      totalPredictions: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
    }
  }
}