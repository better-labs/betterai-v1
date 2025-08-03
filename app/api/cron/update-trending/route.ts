import { NextRequest } from 'next/server'
import { updateTrendingEvents } from '@/lib/data/events'
import { eventQueries, marketQueries, predictionQueries, type NewEvent, type NewMarket } from '@/lib/db/queries'
import type { ApiResponse, DatabaseMetadata, PolymarketEvent, PolymarketMarket } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    // Add your cron job authentication logic here
    // if (token !== process.env.CRON_SECRET) {
    //   return Response.json(
    //     { success: false, error: 'Invalid token' } as ApiResponse,
    //     { status: 401 }
    //   )
    // }

    const startTime = Date.now()
    
    // Step 1: Fetch and update data from Polymarket
    console.log("Starting Polymarket data sync...")
    
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
    const eventsToInsert: NewEvent[] = topEvents.map((event, index) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug || null,
      tags: event.tags || null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      volume: event.volume.toString(),
      trendingRank: index + 1,
      updatedAt: new Date(),
    }))

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
          updatedAt: new Date(),
        }
      })

    // Insert new data
    console.log(`Upserting ${eventsToInsert.length} events...`)
    const insertedEvents = await eventQueries.upsertEvents(eventsToInsert)

    console.log(`Upserting ${marketsToInsert.length} markets...`)
    const insertedMarkets = await marketQueries.upsertMarkets(marketsToInsert)

    // Step 2: Update trending ranks and icons
    await updateTrendingEvents()
    
    const duration = Date.now() - startTime

    const metadata: DatabaseMetadata = {
      database: "neon",
      orm: "drizzle",
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }

    return Response.json({
      success: true,
      message: `Successfully synced ${insertedEvents.length} events and ${insertedMarkets.length} markets from Polymarket`,
      data: {
        duration: `${duration}ms`,
        events_count: insertedEvents.length,
        markets_count: insertedMarkets.length,
        metadata
      }
    } as ApiResponse)
  } catch (error) {
    console.error('Update trending events error:', error)
    return Response.json(
      { success: false, error: 'Failed to update trending events' } as ApiResponse,
      { status: 500 }
    )
  }
}

// Also support GET for easier testing
export async function GET() {
  return Response.json({
    success: true,
    message: 'Update trending events endpoint',
    data: {
      method: 'POST',
      description: 'Updates trending rank for all events based on volume'
    }
  } as ApiResponse)
} 