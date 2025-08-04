import { db } from '@/lib/db'
import { events, markets } from '@/lib/db/schema'
import { eq, desc, gt, sql } from 'drizzle-orm'
import type { Event, NewEvent, Market } from '@/lib/types'

import { eventQueries, marketQueries, type NewMarket } from '@/lib/db/queries'
import type { PolymarketEvent, PolymarketMarket } from '@/lib/types'
import { mapTagsToCategory, CATEGORIES } from '@/lib/categorize'

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



export async function updatePolymarketTrendingEventsAndMarketData(): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[]
}> {
  // Fetch top 10 events from Polymarket API
  const eventsResponse = await fetch("https://gamma-api.polymarket.com/events?limit=10&order=featuredOrder&ascending=true&closed=false&sortBy=volume24h", {
    headers: {
      Accept: "application/json",
      "User-Agent": "PredictionService/1.0",
    },
  })

  if (!eventsResponse.ok) {
    throw new Error(`Polymarket API error: ${eventsResponse.status}`)
  }

  const eventsData = await eventsResponse.json()
  
  if (!Array.isArray(eventsData)) {
    throw new Error("Invalid response format from Polymarket events API")
  }
  
  const topEvents: PolymarketEvent[] = eventsData
    .filter((event): event is PolymarketEvent => {
      const isValid = event && 
             typeof event === 'object' && 
             typeof event.id === 'string' &&
             typeof event.title === 'string' &&
             typeof event.description === 'string' &&
             typeof event.volume === 'number' &&
             (event.slug === undefined || typeof event.slug === 'string') &&
             (event.tags === undefined || Array.isArray(event.tags))
      
      return isValid
    })
    .sort((a: PolymarketEvent, b: PolymarketEvent) => b.volume - a.volume)
    .slice(0, 10)

  console.log(`Fetched ${topEvents.length} top events from Polymarket`)

  // Extract markets from events
  const allMarkets = topEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
  
  console.log(`Extracted ${allMarkets.length} markets from events`)

  // Transform events data for database
  const eventsToInsert: NewEvent[] = topEvents.map((event, index) => {
    // Calculate category based on tags
    const tags = event.tags || []
    const tagLabels = tags.map(tag => tag.label)
    const category = mapTagsToCategory(tagLabels)
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug || null,
      tags: event.tags || null,
      category: category,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: event.volume.toString(),
      trendingRank: index + 1,
      marketProvider: "polymarket",
      updatedAt: new Date(),
    }
  })

  // Transform markets data for database
  const marketsToInsert: NewMarket[] = allMarkets
    .filter((market): market is PolymarketMarket & { eventId: string } => {
      const isValid = market && 
             typeof market === 'object' && 
             typeof market.id === 'string' &&
             typeof market.question === 'string' &&
             typeof market.outcomePrices === 'string' &&
             typeof market.volume === 'string' &&
             typeof market.liquidity === 'string' &&
             typeof market.eventId === 'string'
      
      return isValid
    })
    .map((market: PolymarketMarket) => {
      let outcomePricesArray: string[] = []
      try {
        const parsed = JSON.parse(market.outcomePrices)
        outcomePricesArray = Array.isArray(parsed) ? parsed.map(p => p.toString()) : []
      } catch (error) {
        console.error(`Failed to parse outcomePrices for market ${market.id}:`, error)
      }
      
      return {
        id: market.id,
        question: market.question,
        eventId: market.eventId,
        outcomePrices: outcomePricesArray,
        volume: market.volume,
        liquidity: market.liquidity,
        endDate: market.endDate ? new Date(market.endDate) : null,
        updatedAt: new Date(),
      }
    })

  // Insert new data
  console.log(`Upserting ${eventsToInsert.length} events...`)
  const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)

  console.log(`Upserting ${marketsToInsert.length} markets...`)
  const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)

  return {
    insertedEvents: insertedEvents.filter(Boolean) as Event[],
    insertedMarkets: insertedMarkets.filter(Boolean) as Market[]
  }
}



export async function updatePolymarketAllEventsAndMarketData(): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[]
}> {
  // Fetch all active events from Polymarket API
  const eventsResponse = await fetch("https://gamma-api.polymarket.com/events?order=id&closed=false&active=true&limit=10000", {
    headers: {
      Accept: "application/json",
      "User-Agent": "PredictionService/1.0",
    },
  })

  if (!eventsResponse.ok) {
    throw new Error(`Polymarket API error: ${eventsResponse.status}`)
  }

  const eventsData = await eventsResponse.json()
  
  if (!Array.isArray(eventsData)) {
    throw new Error("Invalid response format from Polymarket events API")
  }
  
  const allEvents: PolymarketEvent[] = eventsData
    .filter((event): event is PolymarketEvent => {
      const isValid = event && 
             typeof event === 'object' && 
             typeof event.id === 'string' &&
             typeof event.title === 'string' &&
             typeof event.description === 'string' &&
             typeof event.volume === 'number' &&
             (event.slug === undefined || typeof event.slug === 'string') &&
             (event.tags === undefined || Array.isArray(event.tags))
      
      return isValid
    })
    .sort((a: PolymarketEvent, b: PolymarketEvent) => b.volume - a.volume)

  console.log(`Fetched ${allEvents.length} active events from Polymarket`)

  // Extract markets from events
  const allMarkets = allEvents
    .flatMap(event => (event.markets || []).map(market => ({ ...market, eventId: event.id })))
  
  console.log(`Extracted ${allMarkets.length} markets from events`)

  // Transform events data for database
  const eventsToInsert: NewEvent[] = allEvents.map((event) => {
    // Calculate category based on tags
    const tags = event.tags || []
    const tagLabels = tags.map(tag => tag.label)
    const category = mapTagsToCategory(tagLabels)
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug || null,
      tags: event.tags || null,
      category: category,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: event.volume.toString(),
      trendingRank: null, // No trending rank for all events
      marketProvider: "polymarket",
      updatedAt: new Date(),
    }
  })

  // Transform markets data for database
  const marketsToInsert: NewMarket[] = allMarkets
    .filter((market): market is PolymarketMarket & { eventId: string } => {
      const isValid = market && 
             typeof market === 'object' && 
             typeof market.id === 'string' &&
             typeof market.question === 'string' &&
             typeof market.outcomePrices === 'string' &&
             typeof market.volume === 'string' &&
             typeof market.liquidity === 'string' &&
             typeof market.eventId === 'string'
      
      return isValid
    })
    .map((market: PolymarketMarket) => {
      let outcomePricesArray: string[] = []
      try {
        const parsed = JSON.parse(market.outcomePrices)
        outcomePricesArray = Array.isArray(parsed) ? parsed.map(p => p.toString()) : []
      } catch (error) {
        console.error(`Failed to parse outcomePrices for market ${market.id}:`, error)
      }
      
      return {
        id: market.id,
        question: market.question,
        eventId: market.eventId,
        outcomePrices: outcomePricesArray,
        volume: market.volume,
        liquidity: market.liquidity,
        endDate: market.endDate ? new Date(market.endDate) : null,
        updatedAt: new Date(),
      }
    })

  // Insert new data
  console.log(`Upserting ${eventsToInsert.length} events...`)
  const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)

  console.log(`Upserting ${marketsToInsert.length} markets...`)
  const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)

  console.log(`Successfully updated ${insertedEvents.length} events and ${insertedMarkets.length} markets`)

  return {
    insertedEvents: insertedEvents.filter(Boolean) as Event[],
    insertedMarkets: insertedMarkets.filter(Boolean) as Market[]
  }
}



