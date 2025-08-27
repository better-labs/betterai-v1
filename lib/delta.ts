import { toUnitProbability } from './utils'

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


