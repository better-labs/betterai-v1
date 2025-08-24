import { serializeDecimals } from "@/lib/serialization"
import type { Market } from "@/lib/generated/prisma"
import type { MarketDTO } from "@/lib/types"

/**
 * Convert raw Prisma Market model to serialized DTO safe for Client Components
 */
export function mapMarketToDTO(market: Market): MarketDTO {
  const serialized = serializeDecimals(market) as any
  
  return {
    id: serialized.id,
    question: serialized.question,
    eventId: serialized.eventId,
    outcomePrices: serialized.outcomePrices ?? [],
    volume: serialized.volume ?? null,
    liquidity: serialized.liquidity ?? null,
    description: serialized.description ?? null,
    active: serialized.active ?? null,
    closed: serialized.closed ?? null,
    endDate: serialized.endDate ?? null,
    updatedAt: serialized.updatedAt ?? null,
    slug: serialized.slug ?? null,
    startDate: serialized.startDate ?? null,
    resolutionSource: serialized.resolutionSource ?? null,
    outcomes: serialized.outcomes ?? [],
    icon: serialized.icon ?? null,
    image: serialized.image ?? null,
  }
}

/**
 * Convert array of Prisma Market models to DTOs
 */
export function mapMarketsToDTO(markets: Market[]): MarketDTO[] {
  const serialized = serializeDecimals(markets) as any[]
  
  return serialized.map((market) => ({
    id: market.id,
    question: market.question,
    eventId: market.eventId,
    outcomePrices: market.outcomePrices ?? [],
    volume: market.volume ?? null,
    liquidity: market.liquidity ?? null,
    description: market.description ?? null,
    active: market.active ?? null,
    closed: market.closed ?? null,
    endDate: market.endDate ?? null,
    updatedAt: market.updatedAt ?? null,
    slug: market.slug ?? null,
    startDate: market.startDate ?? null,
    resolutionSource: market.resolutionSource ?? null,
    outcomes: market.outcomes ?? [],
    icon: market.icon ?? null,
    image: market.image ?? null,
  }))
}