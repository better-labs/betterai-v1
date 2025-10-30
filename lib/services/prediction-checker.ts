import { prisma } from '../db/prisma'
import * as predictionCheckService from './prediction-check-service'
import { isMarketOpenForBetting } from '@/lib/utils/market-status'

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

  // Startup params
  console.log(
    `prediction-check:start lookbackDays=${daysLookback} maxPredictions=${maxPredictions} includeClosedMarkets=${includeClosedMarkets} excludeCategories=[${excludeCategories.join(
      ', '
    )}] since=${sinceDate.toISOString()}`
  )

  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: 'desc' },
    take: maxPredictions,
    include: {
      market: {
        include: {
          event: true,
        },
      },
    },
  })

  console.log(
    `prediction-check:found ${predictions.length} predictions since ${sinceDate.toISOString()}`
  )

  const lowerExclusions = new Set(excludeCategories.map((c) => c.toLowerCase()))

  // Batch check: find predictions that already have a final closed market check
  const predictionIds = predictions.map((p) => p.id)
  const existingClosedChecks = await prisma.predictionCheck.findMany({
    where: {
      predictionId: { in: predictionIds },
      marketClosed: true,
    },
    select: { predictionId: true },
  })
  const predictionsWithClosedCheck = new Set(
    existingClosedChecks.map((check) => check.predictionId)
  )

  console.log(
    `prediction-check:batch-check found ${predictionsWithClosedCheck.size} predictions with existing closed market checks`
  )

  const results: PredictionCheckResult[] = []
  let savedCount = 0
  let processedCount = 0
  let skipNoMarketCount = 0
  let skipExcludedCount = 0
  let skipClosedCount = 0
  let saveErrorCount = 0
  let finalCheckCount = 0

  for (const p of predictions) {
    processedCount += 1
    const market = p.market
    if (!market) {
      skipNoMarketCount += 1
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

    const category = (market.event?.category as unknown as string) ?? null
    if (
      category &&
      lowerExclusions.size > 0 &&
      lowerExclusions.has(category.toLowerCase())
    ) {
      skipExcludedCount += 1
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

    const isMarketOpen = isMarketOpenForBetting({
      closed: market.closed,
      active: market.active,
      closedTime: market.closedTime,
      endDate: market.endDate,
    })

    // If market is closed, check if we need to record final resolution check
    if (!isMarketOpen) {
      if (!includeClosedMarkets) {
        // Check if we already have a final check for this prediction when market was closed
        if (predictionsWithClosedCheck.has(p.id)) {
          // Already captured final market price at resolution, skip
          skipClosedCount += 1
          results.push({
            predictionId: p.id,
            marketId: market.id,
            category,
            aiProbability: null,
            marketProbability: null,
            delta: null,
            absDelta: null,
            saved: false,
            message: 'Market closed; already have final check',
          })
          continue
        }
        // If no existing closed check, fall through to create the final check
        finalCheckCount += 1
        console.log(
          `prediction-check:final-check predictionId=${p.id} marketId=${market.id} - recording final market price`
        )
      } else {
        // includeClosedMarkets=true means check all closed markets regardless
        // This branch is for when explicitly requesting to check closed markets
      }
    }

    // Pull AI probability from stored arrays (index 0)
    const outcomesProbabilities = (p as Record<string, unknown>).outcomesProbabilities as unknown[]
    const aiProbDecimal = Array.isArray(outcomesProbabilities) && outcomesProbabilities.length > 0
      ? outcomesProbabilities[0]
      : null
    const firstOutcomeDecimal = Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0
      ? market.outcomePrices[0]
      : null

    const aiProb = aiProbDecimal && typeof aiProbDecimal === 'object' && 'toNumber' in aiProbDecimal
      ? (aiProbDecimal as { toNumber(): number }).toNumber()
      : typeof aiProbDecimal === 'number' ? aiProbDecimal : null
    const marketProb = firstOutcomeDecimal && typeof firstOutcomeDecimal === 'object' && 'toNumber' in firstOutcomeDecimal
      ? (firstOutcomeDecimal as { toNumber(): number }).toNumber()
      : typeof firstOutcomeDecimal === 'number' ? firstOutcomeDecimal : null

    // Ensure proper typing for database insertion
    const aiProbability: number | null = typeof aiProb === 'number' ? aiProb : null
    const marketProbability: number | null = typeof marketProb === 'number' ? marketProb : null

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
      await predictionCheckService.createPredictionCheck(prisma, {
        predictionId: p.id,
        marketId: market.id,
        // Pass values allowing the DB layer to normalize to Decimal
        aiProbability: aiProbability,
        marketProbability: marketProbability,
        delta,
        absDelta,
        marketClosed: !isMarketOpen, // Use computed status, not just DB flag
      })
      savedCount += 1
      results[results.length - 1] = {
        ...results[results.length - 1],
        saved: true,
      }
    } catch (error) {
      saveErrorCount += 1
      results[results.length - 1] = {
        ...results[results.length - 1],
        saved: false,
        message: error instanceof Error ? error.message : 'Failed to save check',
      }
    }

    // Minimal progress output (every 25 items)
    if (processedCount % 25 === 0 || processedCount === predictions.length) {
      console.log(
        `prediction-check:progress ${processedCount}/${predictions.length} saved=${savedCount} finalChecks=${finalCheckCount} skips(noMarket=${skipNoMarketCount}, excluded=${skipExcludedCount}, closed=${skipClosedCount}) errors=${saveErrorCount}`
      )
    }
  }
  console.log(
    `prediction-check:done processed=${processedCount} saved=${savedCount} finalChecks=${finalCheckCount} skips(noMarket=${skipNoMarketCount}, excluded=${skipExcludedCount}, closed=${skipClosedCount}) errors=${saveErrorCount}`
  )
  return {
    checkedCount: predictions.length,
    savedCount,
    results,
  }
}
