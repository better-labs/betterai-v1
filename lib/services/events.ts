import { PrismaClient, Prisma, Category } from '@/lib/generated/prisma'
import { serializeDecimals } from '@/lib/serialization'
import type { EventDTO } from '@/lib/types'

// Type for Prisma client or transaction
type PrismaContext = PrismaClient | Prisma.TransactionClient

/**
 * Search events with filtering and pagination
 */
export async function searchEvents(
  db: PrismaContext,
  params: {
    q?: string
    category?: Category
    provider?: string
    active?: boolean
    limit?: number
    page?: number
    sortBy?: 'updatedAt' | 'volume' | 'endDate' | 'startDate'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<EventDTO[]> {
  const {
    q = '',
    category,
    provider,
    limit = 20,
    page = 1,
    sortBy = 'volume',
    sortOrder = 'desc'
  } = params

  const where: Prisma.EventWhereInput = {
    OR: q ? [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ] : undefined,
    ...(category && { category: category as Category }),
    ...(provider && { marketProvider: provider }),
  }

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder
  }

  const skip = (page - 1) * limit

  const events = await db.event.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  })

  return events.map(event => {
    const serialized = serializeDecimals(event) as any
    return {
      id: serialized.id,
      title: serialized.title,
      description: serialized.description || null,
      slug: serialized.slug || null,
      icon: serialized.icon || null,
      image: serialized.image || null,
      tags: serialized.tags || null,
      volume: serialized.volume || null,
      endDate: serialized.endDate ? serialized.endDate.toISOString() : null,
      marketProvider: serialized.marketProvider || null,
      updatedAt: serialized.updatedAt ? serialized.updatedAt.toISOString() : null,
      startDate: serialized.startDate ? serialized.startDate.toISOString() : null,
      category: serialized.category || null,
      providerCategory: serialized.providerCategory || null,
    } satisfies EventDTO
  })
}

/**
 * Get trending events by volume
 */
export async function getTrendingEvents(
  db: PrismaContext,
  limit = 10
): Promise<EventDTO[]> {
  return searchEvents(db, {
    limit,
    sortBy: 'volume',
    sortOrder: 'desc'
  })
}

/**
 * Get event by ID
 */
export async function getEventById(
  db: PrismaContext,
  id: string
): Promise<EventDTO | null> {
  try {
    const event = await db.event.findUnique({
      where: { id },
      include: {
        markets: {
          orderBy: { volume: 'desc' },
          take: 10 // Include top markets
        }
      }
    })

    if (!event) return null

    const serialized = serializeDecimals(event) as any
    return {
      id: serialized.id,
      title: serialized.title,
      description: serialized.description || null,
      slug: serialized.slug || null,
      icon: serialized.icon || null,
      image: serialized.image || null,
      tags: serialized.tags || null,
      volume: serialized.volume || null,
      endDate: serialized.endDate ? serialized.endDate.toISOString() : null,
      marketProvider: serialized.marketProvider || null,
      updatedAt: serialized.updatedAt ? serialized.updatedAt.toISOString() : null,
      startDate: serialized.startDate ? serialized.startDate.toISOString() : null,
      category: serialized.category || null,
      providerCategory: serialized.providerCategory || null,
      markets: serialized.markets?.map((m: any) => ({
        id: m.id,
        question: m.question,
        volume: m.volume || null,
        active: m.active || null,
      }))
    } as EventDTO & { markets?: any }
  } catch (error) {
    console.error('Error fetching event by ID:', error)
    return null
  }
}

/**
 * Get events by category
 */
export async function getEventsByCategory(
  db: PrismaContext,
  category: Category,
  limit = 20
): Promise<EventDTO[]> {
  return searchEvents(db, {
    category,
    limit,
    sortBy: 'volume',
    sortOrder: 'desc'
  })
}

/**
 * Create new event (admin only)
 */
export async function createEvent(
  db: PrismaContext,
  eventData: {
    id: string
    title: string
    description?: string
    slug?: string
    icon?: string
    tags?: any
    volume?: number
    endDate?: string
    marketProvider?: string
    startDate?: string
    image?: string
    category?: Category
    providerCategory?: string
  }
): Promise<EventDTO> {
  try {
    const event = await db.event.create({
      data: {
        ...eventData,
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        startDate: eventData.startDate ? new Date(eventData.startDate) : null,
        updatedAt: new Date(),
      }
    })

    const serialized = serializeDecimals(event) as any
    return {
      id: serialized.id,
      title: serialized.title,
      description: serialized.description || null,
      slug: serialized.slug || null,
      icon: serialized.icon || null,
      image: serialized.image || null,
      tags: serialized.tags || null,
      volume: serialized.volume || null,
      endDate: serialized.endDate ? serialized.endDate.toISOString() : null,
      marketProvider: serialized.marketProvider || null,
      updatedAt: serialized.updatedAt ? serialized.updatedAt.toISOString() : null,
      startDate: serialized.startDate ? serialized.startDate.toISOString() : null,
      category: serialized.category || null,
      providerCategory: serialized.providerCategory || null,
    } satisfies EventDTO
  } catch (error) {
    console.error('Error creating event:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Event with this ID already exists')
      }
    }
    throw new Error('Failed to create event')
  }
}

/**
 * Update event (admin only)
 */
export async function updateEvent(
  db: PrismaContext,
  id: string,
  updateData: Partial<{
    title: string
    description?: string
    slug?: string
    icon?: string
    tags?: any
    volume?: number
    endDate?: string
    marketProvider?: string
    startDate?: string
    image?: string
    category?: Category
    providerCategory?: string
  }>
): Promise<EventDTO | null> {
  try {
    const event = await db.event.update({
      where: { id },
      data: {
        ...updateData,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        updatedAt: new Date(),
      }
    })

    const serialized = serializeDecimals(event) as any
    return {
      id: serialized.id,
      title: serialized.title,
      description: serialized.description || null,
      slug: serialized.slug || null,
      icon: serialized.icon || null,
      image: serialized.image || null,
      tags: serialized.tags || null,
      volume: serialized.volume || null,
      endDate: serialized.endDate ? serialized.endDate.toISOString() : null,
      marketProvider: serialized.marketProvider || null,
      updatedAt: serialized.updatedAt ? serialized.updatedAt.toISOString() : null,
      startDate: serialized.startDate ? serialized.startDate.toISOString() : null,
      category: serialized.category || null,
      providerCategory: serialized.providerCategory || null,
    } satisfies EventDTO
  } catch (error) {
    console.error('Error updating event:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return null // Event not found
      }
    }
    throw new Error('Failed to update event')
  }
}

/**
 * Delete event (admin only)
 */
export async function deleteEvent(
  db: PrismaContext,
  id: string
): Promise<boolean> {
  try {
    await db.event.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error('Error deleting event:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return false // Event not found
      }
    }
    throw new Error('Failed to delete event')
  }
}