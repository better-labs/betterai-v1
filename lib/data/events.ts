import { db } from '@/lib/db'
import { events, markets } from '@/lib/db/schema'
import { eq, desc, gt } from 'drizzle-orm'
import type { Event, NewEvent, Market } from '@/lib/types'
import { getEventById as getPolymarketEvent } from '@/lib/polymarket'

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

export async function updateEventIcon(eventId: string): Promise<Event | null> {
  try {
    // Fetch event data from Polymarket
    const polymarketEvent = await getPolymarketEvent(eventId);
    
    if (!polymarketEvent) {
      console.warn(`Event not found in Polymarket: ${eventId}`);
      return null;
    }
    
    // Update the event with icon data
    const [result] = await db
      .update(events)
      .set({ 
        icon: polymarketEvent.icon,
        updatedAt: new Date() 
      })
      .where(eq(events.id, eventId))
      .returning();
    
    return result || null;
  } catch (error) {
    console.error('Error updating event icon:', error);
    return null;
  }
}

export async function updateTrendingEvents(): Promise<void> {
  // Update trending rank based on volume
  await db.execute(`
    UPDATE events 
    SET trending_rank = CASE 
      WHEN volume > 1000000 THEN 3
      WHEN volume > 100000 THEN 2
      WHEN volume > 10000 THEN 1
      ELSE 0
    END,
    updated_at = NOW()
  `)

  // Also update icons for all events
  const allEvents = await db.query.events.findMany({
    columns: {
      id: true
    }
  })

  console.log(`Updating icons for ${allEvents.length} events...`)
  
  for (const event of allEvents) {
    try {
      await updateEventIcon(event.id)
      console.log(`Updated icon for event: ${event.id}`)
    } catch (error) {
      console.error(`Failed to update icon for event ${event.id}:`, error)
    }
  }
  
  console.log('Finished updating event icons')
} 