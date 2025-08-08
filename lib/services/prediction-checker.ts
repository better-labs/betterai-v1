import { prisma } from '../db/prisma'
import { predictionCheckQueries } from '../db/queries'
import { Category } from '../generated/prisma'

export type CheckerConfig = {
  daysLookback?: number
  maxPredictions?: number
  includeClosedMarkets?: boolean
  excludeCategories?: Array<string>
}

export type PredictionCheckResult = {
  predictionId: number
  marketId: string | null
  category: string | null
  aiProbability: number | null
  marketProbability: number | null
  delta: number | null
  absDelta: number | null
  saved: boolean
  message?: string
}

export async function generatePredictionVsMarketDelta(
  config: CheckerConfig = {}
): Promise<{
  checkedCount: number
  savedCount: number
  results: PredictionCheckResult[]
}> {
  const {
    daysLookback = 30,
    maxPredictions = 200,
    includeClosedMarkets = false,
    excludeCategories = [],
  } = config

  const sinceDate = new Date(Date.now() - daysLookback * 24 * 60 * 60 * 1000)

  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: 'desc' },
    take: maxPredictions,
    include: {
      market: true,
    },
  })

  const lowerExclusions = new Set(excludeCategories.map((c) => c.toLowerCase()))

  const results: PredictionCheckResult[] = []
  let savedCount = 0

  for (const p of predictions) {
    const market = p.market
    if (!market) {
      results.push({
        predictionId: p.id,
        marketId: null,
        category: null,
        aiProbability: null,
        marketProbability: null,
        delta: null,
        absDelta: null,
        saved: false,
        message: 'No market attached',
      })
      continue
    }

    const category = (market.category as unknown as string) ?? null
    if (
      category &&
      lowerExclusions.size > 0 &&
      lowerExclusions.has(category.toLowerCase())
    ) {
      results.push({
        predictionId: p.id,
        marketId: market.id,
        category,
        aiProbability: null,
        marketProbability: null,
        delta: null,
        absDelta: null,
        saved: false,
        message: 'Excluded category',
      })
      continue
    }

    if (!includeClosedMarkets && market.closed) {
      results.push({
        predictionId: p.id,
        marketId: market.id,
        category,
        aiProbability: null,
        marketProbability: null,
        delta: null,
        absDelta: null,
        saved: false,
        message: 'Market closed; skipping',
      })
      continue
    }

    // Pull Decimal values from Prisma and convert to numbers only for the response payload
    const aiProbDecimal = p.probability ?? null
    const firstOutcomeDecimal = Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0
      ? market.outcomePrices[0]
      : null

    const aiProb = aiProbDecimal ? aiProbDecimal.toNumber() : null
    const marketProb = firstOutcomeDecimal ? firstOutcomeDecimal.toNumber() : null

    // Calculate deltas in number space for the response
    const delta = aiProb !== null && marketProb !== null ? aiProb - marketProb : null
    const absDelta = delta !== null ? Math.abs(delta) : null

    // Record the check result (not persisted yet)
    results.push({
      predictionId: p.id,
      marketId: market.id,
      category,
      aiProbability: aiProb,
      marketProbability: marketProb,
      delta,
      absDelta,
      saved: false,
    })
    // save the results to the database
    try {
      await predictionCheckQueries.create({
        predictionId: p.id,
        marketId: market.id,
        // Pass values allowing the DB layer to normalize to Decimal
        aiProbability: aiProbDecimal ?? null,
        marketProbability: firstOutcomeDecimal ?? null,
        delta,
        absDelta,
        marketClosed: !!market.closed,
        marketCategory: category as Category | null,
      })
      savedCount += 1
      results[results.length - 1] = {
        ...results[results.length - 1],
        saved: true,
      }
    } catch (error) {
      results[results.length - 1] = {
        ...results[results.length - 1],
        saved: false,
        message: error instanceof Error ? error.message : 'Failed to save check',
      }
    }
  }
  return {
    checkedCount: predictions.length,
    savedCount,
    results,
  }
}
