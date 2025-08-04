import { NextRequest } from 'next/server'
import { updatePolymarketAllEventsAndMarketData } from '@/lib/data/events'
import type { ApiResponse, DatabaseMetadata } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    // Add your cron job authentication logic here
    if (token !== process.env.CRON_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    
    console.log("Starting Polymarket all events data sync...")
    
    // Use the new function to update all events and market data
    const { insertedEvents, insertedMarkets } = await updatePolymarketAllEventsAndMarketData()
    
    const duration = Date.now() - startTime

    const metadata: DatabaseMetadata = {
      database: "neon",
      orm: "drizzle",
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${insertedEvents.length} events and ${insertedMarkets.length} markets from Polymarket`,
        data: {
          duration: `${duration}ms`,
          events_count: insertedEvents.length,
          markets_count: insertedMarkets.length,
          metadata
        }
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update all Polymarket events error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update all Polymarket events' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Also support GET for easier testing
export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Update all Polymarket events endpoint',
      data: {
        method: 'POST',
        description: 'Updates all active events and markets from Polymarket'
      }
    } as ApiResponse),
    { headers: { 'Content-Type': 'application/json' } }
  )
} 