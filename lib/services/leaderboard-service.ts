import type { PrismaClient } from '@/lib/generated/prisma'

/**
 * Leaderboard service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return typed leaderboard data (no complex serialization needed)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

type LeaderboardEntry = {
  modelName: string
  totalPredictions: number
  resolvedPredictions: number
  correctPredictions: number
  accuracyRate: number
  avgConfidenceInWinner: number
  lastPredictionAt: Date
}

export async function getAIModelLeaderboard(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<LeaderboardEntry[]> {
  // First, get all predictions with their market data
  const predictions = await db.prediction.findMany({
    where: {
      modelName: { not: null }
    },
    include: {
      market: {
        select: {
          id: true,
          outcomePrices: true,
          closed: true
        }
      }
    }
  })

  // Process the results to calculate accuracy
  const modelStats = new Map<string, {
    totalPredictions: number
    resolvedPredictions: number
    correctPredictions: number
    confidenceSum: number
    lastPredictionAt: Date
  }>()

  predictions.forEach(prediction => {
    if (!prediction.modelName) return

    const modelName = prediction.modelName
    const stats = modelStats.get(modelName) || {
      totalPredictions: 0,
      resolvedPredictions: 0,
      correctPredictions: 0,
      confidenceSum: 0,
      lastPredictionAt: prediction.createdAt || new Date()
    }

    stats.totalPredictions++
    if (prediction.createdAt && prediction.createdAt > stats.lastPredictionAt) {
      stats.lastPredictionAt = prediction.createdAt
    }

    // Check if market is resolved and binary
    const market = prediction.market
    const prices = market?.outcomePrices || []
    const probabilities = prediction.outcomesProbabilities || []
    
    if (prices.length === 2 && probabilities.length === 2) {
      // Convert Prisma Decimal to number and check if market has a clear winner
      const price1 = Number(prices[0])
      const price2 = Number(prices[1])
      const prob1 = Number(probabilities[0])
      const prob2 = Number(probabilities[1])
      
      // Check if market is resolved (one outcome = 1, other = 0)
      if ((price1 === 1 && price2 === 0) || (price1 === 0 && price2 === 1)) {
        stats.resolvedPredictions++
        
        // Calculate AI confidence in the winning outcome
        const aiConfidenceInWinner = price1 === 1 ? prob1 : prob2
        stats.confidenceSum += aiConfidenceInWinner
        
        // Check if AI predicted correctly (assigned ≥50% to winner)
        if (aiConfidenceInWinner >= 0.5) {
          stats.correctPredictions++
        }
      }
    }

    modelStats.set(modelName, stats)
  })

  // Convert to final format
  const leaderboard = Array.from(modelStats.entries()).map(([modelName, stats]) => ({
    modelName,
    totalPredictions: stats.totalPredictions,
    resolvedPredictions: stats.resolvedPredictions,
    correctPredictions: stats.correctPredictions,
    accuracyRate: stats.resolvedPredictions > 0 ? stats.correctPredictions / stats.resolvedPredictions : 0,
    avgConfidenceInWinner: stats.resolvedPredictions > 0 ? stats.confidenceSum / stats.resolvedPredictions : 0,
    lastPredictionAt: stats.lastPredictionAt
  }))

  // Sort by accuracy, then by resolved predictions, then by total predictions
  return leaderboard.sort((a, b) => {
    if (a.accuracyRate !== b.accuracyRate) return b.accuracyRate - a.accuracyRate
    if (a.resolvedPredictions !== b.resolvedPredictions) return b.resolvedPredictions - a.resolvedPredictions
    return b.totalPredictions - a.totalPredictions
  })
}

export async function getAIModelLeaderboardByTag(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  tagLabel: string
): Promise<LeaderboardEntry[]> {
  // Get predictions filtered by tag
  const predictions = await db.prediction.findMany({
    where: {
      modelName: { not: null },
      market: {
        event: {
          eventTags: {
            some: {
              tag: {
                label: {
                  equals: tagLabel,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      }
    },
    include: {
      market: {
        select: {
          id: true,
          outcomePrices: true,
          closed: true
        }
      }
    }
  })

  // Process the results to calculate accuracy (same logic as main leaderboard)
  const modelStats = new Map<string, {
    totalPredictions: number
    resolvedPredictions: number
    correctPredictions: number
    confidenceSum: number
    lastPredictionAt: Date
  }>()

  predictions.forEach(prediction => {
    if (!prediction.modelName) return

    const modelName = prediction.modelName
    const stats = modelStats.get(modelName) || {
      totalPredictions: 0,
      resolvedPredictions: 0,
      correctPredictions: 0,
      confidenceSum: 0,
      lastPredictionAt: prediction.createdAt || new Date()
    }

    stats.totalPredictions++
    if (prediction.createdAt && prediction.createdAt > stats.lastPredictionAt) {
      stats.lastPredictionAt = prediction.createdAt
    }

    // Check if market is resolved and binary
    const market = prediction.market
    const prices = market?.outcomePrices || []
    const probabilities = prediction.outcomesProbabilities || []
    
    if (prices.length === 2 && probabilities.length === 2) {
      // Convert Prisma Decimal to number and check if market has a clear winner
      const price1 = Number(prices[0])
      const price2 = Number(prices[1])
      const prob1 = Number(probabilities[0])
      const prob2 = Number(probabilities[1])
      
      // Check if market is resolved (one outcome = 1, other = 0)
      if ((price1 === 1 && price2 === 0) || (price1 === 0 && price2 === 1)) {
        stats.resolvedPredictions++
        
        const aiConfidenceInWinner = price1 === 1 ? prob1 : prob2
        stats.confidenceSum += aiConfidenceInWinner
        
        if (aiConfidenceInWinner >= 0.5) {
          stats.correctPredictions++
        }
      }
    }

    modelStats.set(modelName, stats)
  })

  // Convert to final format
  const leaderboard = Array.from(modelStats.entries()).map(([modelName, stats]) => ({
    modelName,
    totalPredictions: stats.totalPredictions,
    resolvedPredictions: stats.resolvedPredictions,
    correctPredictions: stats.correctPredictions,
    accuracyRate: stats.resolvedPredictions > 0 ? stats.correctPredictions / stats.resolvedPredictions : 0,
    avgConfidenceInWinner: stats.resolvedPredictions > 0 ? stats.confidenceSum / stats.resolvedPredictions : 0,
    lastPredictionAt: stats.lastPredictionAt
  }))

  return leaderboard.sort((a, b) => {
    if (a.accuracyRate !== b.accuracyRate) return b.accuracyRate - a.accuracyRate
    if (a.resolvedPredictions !== b.resolvedPredictions) return b.resolvedPredictions - a.resolvedPredictions
    return b.totalPredictions - a.totalPredictions
  })
}