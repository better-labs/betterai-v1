import { toUnitProbability } from './utils'

export const DELTA_TOOLTIP = 'Absolute difference between Market and AI probabilities'

export function getDeltaColor(delta: number | null): string {
  if (delta == null) return 'text-muted-foreground'
  if (delta >= 0.10) return 'text-green-600' // High disagreement - major AI insight!
  if (delta >= 0.05) return 'text-yellow-600' // Small disagreement
  return 'text-foreground' // Close agreement - no color
}

export function getDeltaTone(delta: number | null): "neutral" | "positive" | "caution" {
  if (delta == null) return "neutral"
  if (delta >= 0.10) return "positive" // High disagreement - major AI insight!
  if (delta >= 0.05) return "caution" // Small disagreement
  return "neutral" // Close agreement
}

export function computeDeltaFromArrays(
  marketOutcomePrices: unknown[] | null | undefined,
  aiOutcomesProbabilities: unknown[] | null | undefined
): number | null {
  if (!Array.isArray(marketOutcomePrices) || !Array.isArray(aiOutcomesProbabilities)) return null
  const marketP0 = toUnitProbability(marketOutcomePrices[0])
  const aiP0 = toUnitProbability(aiOutcomesProbabilities[0])
  if (marketP0 == null || aiP0 == null) return null
  return Math.abs(marketP0 - aiP0)
}

export function computeDeltaFromValues(
  marketProbability: unknown,
  aiProbability: unknown
): number | null {
  const marketP0 = toUnitProbability(marketProbability)
  const aiP0 = toUnitProbability(aiProbability)
  if (marketP0 == null || aiP0 == null) return null
  return Math.abs(marketP0 - aiP0)
}


