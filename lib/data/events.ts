import { db } from '@/lib/db'
import { events, markets } from '@/lib/db/schema'
import { eq, desc, gt, sql } from 'drizzle-orm'
import type { Event, NewEvent, Market } from '@/lib/types'

import { CATEGORIES } from '@/lib/categorize'

export async function getTrendingEvents(): Promise<Event[]> {
  return await db.query.events.findMany({
    where: (events, { gt }) => gt(events.trendingRank, 0),
    orderBy: (events, { desc }) => [desc(events.trendingRank)],
    limit: 10
  })
}

export async function getTrendingEventsWithMarkets(): Promise<(Event & { markets: Market[] })[]> {
  // Get trending events first
  const trendingEvents = await db.query.events.findMany({
    where: (events, { gt }) => gt(events.trendingRank, 0),
    orderBy: (events, { desc }) => [desc(events.trendingRank)],
    limit: 10
  })

  // Get all markets for these events in a single query
  const eventIds = trendingEvents.map(event => event.id)
  const allMarkets = await db.query.markets.findMany({
    where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
    orderBy: (markets, { desc }) => [desc(markets.volume)]
  })

  // Group markets by eventId
  const marketsByEventId = allMarkets.reduce((acc, market) => {
    if (market.eventId) {
      if (!acc[market.eventId]) {
        acc[market.eventId] = []
      }
      acc[market.eventId].push(market)
    }
    return acc
  }, {} as Record<string, Market[]>)

  // Combine events with their markets
  return trendingEvents.map(event => ({
    ...event,
    markets: marketsByEventId[event.id] || []
  }))
}

export async function getEventById(id: string): Promise<Event | null> {
  const result = await db.query.events.findFirst({
    where: (events, { eq }) => eq(events.id, id)
  })
  return result || null
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const result = await db.query.events.findFirst({
    where: (events, { eq }) => eq(events.slug, slug)
  })
  return result || null
}

export async function createEvent(eventData: NewEvent): Promise<Event> {
  const [result] = await db.insert(events).values(eventData).returning()
  return result
}

export async function updateEvent(id: string, eventData: Partial<NewEvent>): Promise<Event | null> {
  const [result] = await db
    .update(events)
    .set({ ...eventData, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning()
  return result || null
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await db.delete(events).where(eq(events.id, id))
  return result.rowCount > 0
}

export async function getEventsByCategory(categoryId: number): Promise<Event[]> {
  return await db.query.events.findMany({
    where: (events, { eq }) => eq(events.category, categoryId),
    orderBy: (events, { desc }) => [desc(events.volume)]
  })
}

export async function getEventsByCategoryWithMarkets(categoryId: number): Promise<(Event & { markets: Market[] })[]> {
  // Get events by category
  const categoryEvents = await db.query.events.findMany({
    where: (events, { eq }) => eq(events.category, categoryId),
    orderBy: (events, { desc }) => [desc(events.volume)]
  })

  // Get all markets for these events in a single query
  const eventIds = categoryEvents.map(event => event.id)
  const allMarkets = await db.query.markets.findMany({
    where: (markets, { inArray }) => inArray(markets.eventId, eventIds),
    orderBy: (markets, { desc }) => [desc(markets.volume)]
  })

  // Group markets by eventId
  const marketsByEventId = allMarkets.reduce((acc, market) => {
    if (market.eventId) {
      if (!acc[market.eventId]) {
        acc[market.eventId] = []
      }
      acc[market.eventId].push(market)
    }
    return acc
  }, {} as Record<string, Market[]>)

  // Combine events with their markets
  return categoryEvents.map(event => ({
    ...event,
    markets: marketsByEventId[event.id] || []
  }))
}

export async function getCategoryStats(): Promise<Array<{
  categoryId: number;
  categoryName: string;
  eventCount: number;
}>> {
  // Get event counts by category
  const result = await db
    .select({
      category: events.category,
      count: sql<number>`count(*)::int`
    })
    .from(events)
    .where(sql`${events.category} IS NOT NULL`)
    .groupBy(events.category)

  // Map to include category names
  return result.map(row => ({
    categoryId: row.category!,
    categoryName: CATEGORIES[row.category as keyof typeof CATEGORIES] || 'Unknown',
    eventCount: row.count
  })).sort((a, b) => b.eventCount - a.eventCount)
}








