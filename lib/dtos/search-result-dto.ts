import { serializeDecimals } from "@/lib/serialization"
import type { Market, Event, Tag, Prediction } from "@/lib/generated/prisma"
import type { MarketDTO, EventDTO, PredictionDTO, TagDTO } from "@/lib/types"
import { mapMarketsToDTO } from "./market-dto"
import { mapEventsToDTO } from "./event-dto"



/**
 * Search Result DTO for serialized responses safe for Client Components
 */
export interface SearchResultDTO {
  markets: Array<MarketDTO & { event: EventDTO | null, predictions: PredictionDTO[] }>
  events: Array<EventDTO & { markets?: MarketDTO[] }>
  tags: TagDTO[]
  totalResults: number
  suggestions?: string[]
}

/**
 * Convert raw Prisma Tag model to serialized DTO safe for Client Components
 */
export function mapTagToDTO(tag: Tag & { eventCount?: number }): TagDTO {
  const serialized = serializeDecimals(tag) as any
  
  return {
    id: serialized.id,
    label: serialized.label,
    slug: serialized.slug ?? null,
    forceShow: serialized.forceShow ?? null,
    providerUpdatedAt: serialized.providerUpdatedAt ?? null,
    provider: serialized.provider ?? null,
    eventCount: serialized.eventCount,
  }
}

/**
 * Convert array of Prisma Tag models to DTOs
 */
export function mapTagsToDTO(tags: Array<Tag & { eventCount?: number }>): TagDTO[] {
  const serialized = serializeDecimals(tags) as any[]
  
  return serialized.map((tag) => ({
    id: tag.id,
    label: tag.label,
    slug: tag.slug ?? null,
    forceShow: tag.forceShow ?? null,
    providerUpdatedAt: tag.providerUpdatedAt ?? null,
    provider: tag.provider ?? null,
    eventCount: tag.eventCount,
  }))
}

/**
 * Convert raw search result to serialized DTO safe for Client Components
 */
export function mapSearchResultToDTO(result: {
  markets: Array<Market & { event: Event | null, predictions: Prediction[] }>
  events: Array<Event & { markets?: Market[] }>
  tags: Array<Tag & { eventCount?: number }>
  totalResults: number
  suggestions?: string[]
}): SearchResultDTO {
  return {
    markets: mapMarketsToDTO(result.markets),
    events: mapEventsToDTO(result.events),
    tags: mapTagsToDTO(result.tags),
    totalResults: result.totalResults,
    suggestions: result.suggestions,
  }
}
