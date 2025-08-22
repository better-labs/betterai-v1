import { prisma } from "../prisma"
import type { Event, Market, Category } from '../../../lib/generated/prisma';
import { CATEGORY_DISPLAY_NAME } from '@/lib/categorize'
import { serializeDecimals } from "@/lib/serialization"
import type { EventDTO, MarketDTO } from "@/lib/types"

// Event queries
export const eventQueries = {
  getTrendingEvents: async (): Promise<Event[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10
    })
  },
  getTrendingEventsWithMarkets: async (): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10,
      include: {
        markets: {
          orderBy: {
            volume: 'desc'
          }
        }
      }
    })
  },
  getEventById: async (id: string): Promise<Event | null> => {
    return await prisma.event.findUnique({
      where: { id }
    })
  },
  /** Serialized wrappers returning DTO-safe shapes */
  getEventByIdSerialized: async (id: string): Promise<EventDTO | null> => {
    const e = await eventQueries.getEventById(id)
    if (!e) return null
    const s = serializeDecimals(e) as any
    return {
      id: s.id,
      title: s.title,
      description: s.description ?? null,
      slug: s.slug ?? null,
      icon: s.icon ?? null,
      image: s.image ?? null,
      tags: s.tags ?? null,
      volume: s.volume ?? null,
      endDate: s.endDate ?? null,
      marketProvider: s.marketProvider ?? null,
      updatedAt: s.updatedAt ?? null,
      startDate: s.startDate ?? null,
      category: s.category ?? null,
      providerCategory: s.providerCategory ?? null,
    }
  },
  getEventBySlug: async (slug: string): Promise<Event | null> => {
    return await prisma.event.findFirst({
      where: { slug }
    })
  },
  createEvent: async (eventData: any): Promise<Event> => {
    return await prisma.event.create({ data: eventData })
  },
  updateEvent: async (id: string, eventData: Partial<any>): Promise<Event | null> => {
    return await prisma.event.update({
      where: { id },
      data: { ...eventData, updatedAt: new Date() }
    })
  },
  deleteEvent: async (id: string): Promise<boolean> => {
    const result = await prisma.event.delete({ where: { id } })
    return !!result
  },
  getEventsByCategory: async (category: Category): Promise<Event[]> => {
    return await prisma.event.findMany({
      where: { category },
      orderBy: { volume: 'desc' }
    })
  },
  getEventsByCategoryWithMarkets: async (category: Category): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      where: { category },
      orderBy: { volume: 'desc' },
      include: {
        markets: {
          orderBy: {
            volume: 'desc'
          }
        }
      }
    })
  },
  getCategoryStats: async (): Promise<Array<{
    category: Category;
    categoryName: string;
    eventCount: number;
  }>> => {
    const result = await prisma.event.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: {
        category: {
          not: null
        }
      }
    })
  
    return result.map(row => ({
      category: row.category as Category,
      categoryName: CATEGORY_DISPLAY_NAME[row.category as Category] || 'Unknown',
      eventCount: row._count.category
    })).sort((a, b) => b.eventCount - a.eventCount)
  },
  getTopEvents: async (limit = 10) => {
    return await prisma.event.findMany({
        orderBy: { volume: 'desc' },
        take: limit
    });
  },
  deleteAllEvents: async () => {
    const result = await prisma.event.deleteMany({})
    return result.count
  },
  upsertEvents: async (eventsData: any[]) => {
    if (eventsData.length === 0) {
      return [];
    }
    // Process in chunks to avoid very large transactions that hurt latency on serverless Postgres
    const results: Event[] = [] as unknown as Event[]
    const CHUNK_SIZE = 100
    for (let i = 0; i < eventsData.length; i += CHUNK_SIZE) {
      const chunk = eventsData.slice(i, i + CHUNK_SIZE)
      const transactions = chunk.map(event =>
        prisma.event.upsert({
          where: { id: event.id },
          update: { ...event, updatedAt: new Date() },
          create: event,
        })
      )
      const res = await prisma.$transaction(transactions)
      results.push(...(res as unknown as Event[]))
    }
    return results
  },
  /**
   * Search events by title and description text
   */
  searchEvents: async (
    searchTerm: string,
    options?: {
      limit?: number
      includeMarkets?: boolean
    }
  ): Promise<Array<Event & { markets?: Market[] }>> => {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
    
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: options?.includeMarkets ? {
        markets: {
          orderBy: { volume: 'desc' },
          take: 5 // Limit markets per event for performance
        }
      } : undefined,
      orderBy: { volume: 'desc' },
      take: limit,
    })
    
    return events
  },
}