import type { PrismaClient, Event, Market, Category } from '@/lib/generated/prisma'
import { mapEventToDTO, mapEventsToDTO } from '@/lib/dtos'
import type { EventDTO } from '@/lib/types'
import { CATEGORY_DISPLAY_NAME } from '@/lib/categorize'

/**
 * Event service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs (never raw Prisma models)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getTrendingEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<Event[]> {
  return await db.event.findMany({
    orderBy: { volume: 'desc' },
    take: 10
  })
}

export async function getTrendingEventsWithMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  withPredictions = false
): Promise<any[]> {
  const whereClause = withPredictions ? {
    markets: {
      some: {
        predictions: {
          some: {}
        }
      }
    }
  } : {}

  return await db.event.findMany({
    where: whereClause,
    orderBy: { volume: 'desc' },
    take: 10,
    include: {
      markets: {
        where: withPredictions ? {
          predictions: {
            some: {}
          }
        } : {},
        orderBy: {
          volume: 'desc'
        },
        include: withPredictions ? {
          predictions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              outcomes: true,
              outcomesProbabilities: true,
              createdAt: true,
              modelName: true,
            }
          }
        } : {}
      },
      eventTags: {
        include: {
          tag: {
            select: {
              id: true,
              label: true,
              slug: true,
              forceShow: true
            }
          }
        }
      }
    }
  })
}

export async function getEventById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<Event | null> {
  return await db.event.findUnique({
    where: { id }
  })
}

export async function getEventByIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<EventDTO | null> {
  const event = await getEventById(db, id)
  if (!event) return null
  return mapEventToDTO(event)
}

export async function getEventBySlug(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  slug: string
): Promise<Event | null> {
  return await db.event.findFirst({
    where: { slug }
  })
}

export async function createEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventData: any
): Promise<Event> {
  return await db.event.create({ data: eventData })
}

export async function updateEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  eventData: Partial<any>
): Promise<Event | null> {
  return await db.event.update({
    where: { id },
    data: { ...eventData, updatedAt: new Date() }
  })
}

export async function deleteEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<boolean> {
  const result = await db.event.delete({ where: { id } })
  return !!result
}

export async function getEventsByCategory(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  category: Category
): Promise<Event[]> {
  return await db.event.findMany({
    where: { category },
    orderBy: { volume: 'desc' }
  })
}

export async function getEventsByCategoryWithMarkets(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  category: Category
): Promise<(Event & { markets: Market[] })[]> {
  return await db.event.findMany({
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
}

export async function getCategoryStats(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<Array<{
  category: Category;
  categoryName: string;
  eventCount: number;
}>> {
  const result = await db.event.groupBy({
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
}

export async function getTopEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit = 10
): Promise<Event[]> {
  return await db.event.findMany({
    orderBy: { volume: 'desc' },
    take: limit
  })
}

export async function deleteAllEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<number> {
  const result = await db.event.deleteMany({})
  return result.count
}

export async function upsertEvents(
  db: PrismaClient,
  eventsData: any[]
): Promise<Event[]> {
  if (eventsData.length === 0) {
    return []
  }
  
  // Process in chunks to avoid very large transactions that hurt latency on serverless Postgres
  const results: Event[] = []
  const CHUNK_SIZE = 100
  
  for (let i = 0; i < eventsData.length; i += CHUNK_SIZE) {
    const chunk = eventsData.slice(i, i + CHUNK_SIZE)
    const transactions = chunk.map(event =>
      db.event.upsert({
        where: { id: event.id },
        update: { ...event, updatedAt: new Date() },
        create: event,
      })
    )
    const res = await db.$transaction(transactions)
    results.push(...res)
  }
  
  return results
}

/**
 * Search events by title and description text
 */
export async function searchEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    limit?: number
    includeMarkets?: boolean
  }
): Promise<Array<Event & { markets?: Market[] }>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  
  const events = await db.event.findMany({
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
}