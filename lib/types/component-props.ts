/**
 * Strict type definitions for client component props
 * These types prevent raw Prisma data from being passed to client components
 */

import type { ClientSafe, ClientComponentProps } from './client-safe'
import type { MarketDTO, PredictionDTO, EventDTO, PredictionCheckDTO } from '../types'

// Strict prop types for common components
export interface MarketDetailsCardProps extends ClientComponentProps<{
  market: MarketDTO
  event?: EventDTO | null
  externalMarketUrl?: string | null
  latestPrediction?: PredictionDTO | null
}> {}

export interface PredictionHistoryListProps extends ClientComponentProps<{
  predictions?: PredictionDTO[] | null
  checks?: PredictionCheckDTO[] | null
  marketId?: string | null
  showChecks?: boolean
  showPredictions?: boolean
  className?: string
}> {}

export interface PredictionSummaryCardProps extends ClientComponentProps<{
  marketOutcomes?: string[] | null
  marketOutcomePrices?: number[] | null
  aiOutcomes?: string[] | null
  aiOutcomesProbabilities?: number[] | null
  confidenceLevel?: string | null
  modelName?: string | null
  createdAt: string
}> {}

/**
 * Usage example:
 * 
 * // In a client component file:
 * export function MarketDetailsCard(props: MarketDetailsCardProps) {
 *   // TypeScript will ensure props.market is properly serialized
 *   // If raw Prisma data is passed, you'll get a compile error
 * }
 */