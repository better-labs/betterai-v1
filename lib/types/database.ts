/**
 * Database entity creation types
 * Moved from old lib/db/queries during Phase 8 cleanup
 */

export interface NewMarket {
  id: string
  question: string
  description?: string | null
  eventId: string
  outcomes?: string | null
  outcomePrices?: string | number[] | null
  volume?: number | null
  liquidity?: number | null
  active?: boolean | null
  closed?: boolean | null
  endDate?: Date | null
  image?: string | null
  category?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface NewEvent {
  id: string
  title: string
  description?: string | null
  slug?: string | null
  icon?: string | null
  image?: string | null
  category?: string | null
  providerCategory?: string | null
  volume?: number | null
  startDate?: Date | null
  endDate?: Date | null
  marketProvider?: string | null
  tags?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface NewAIModel {
  id: string
  name: string
  created: number
  description?: string | null
  architecture?: any
  topProvider?: any
  pricing?: any
  canonicalSlug?: string | null
  contextLength?: number | null
  huggingFaceId?: string | null
  perRequestLimits?: any
  supportedParameters?: any
  updatedAt: Date
}