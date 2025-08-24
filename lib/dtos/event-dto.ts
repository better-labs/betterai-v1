import { serializeDecimals } from "@/lib/serialization"
import type { Event } from "@/lib/generated/prisma"
import type { EventDTO } from "@/lib/types"

/**
 * Convert raw Prisma Event model to serialized DTO safe for Client Components
 */
export function mapEventToDTO(event: Event): EventDTO {
  const serialized = serializeDecimals(event) as any
  
  return {
    id: serialized.id,
    title: serialized.title,
    description: serialized.description ?? null,
    slug: serialized.slug ?? null,
    icon: serialized.icon ?? null,
    image: serialized.image ?? null,
    tags: serialized.tags ?? null,
    volume: serialized.volume ?? null,
    endDate: serialized.endDate ?? null,
    marketProvider: serialized.marketProvider ?? null,
    updatedAt: serialized.updatedAt ?? null,
    startDate: serialized.startDate ?? null,
    category: serialized.category ?? null,
    providerCategory: serialized.providerCategory ?? null,
  }
}

/**
 * Convert array of Prisma Event models to DTOs
 */
export function mapEventsToDTO(events: Event[]): EventDTO[] {
  const serialized = serializeDecimals(events) as any[]
  
  return serialized.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    slug: event.slug ?? null,
    icon: event.icon ?? null,
    image: event.image ?? null,
    tags: event.tags ?? null,
    volume: event.volume ?? null,
    endDate: event.endDate ?? null,
    marketProvider: event.marketProvider ?? null,
    updatedAt: event.updatedAt ?? null,
    startDate: event.startDate ?? null,
    category: event.category ?? null,
    providerCategory: event.providerCategory ?? null,
  }))
}