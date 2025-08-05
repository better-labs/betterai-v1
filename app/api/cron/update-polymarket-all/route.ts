import { NextRequest } from 'next/server'
import { updatePolymarketAllEventsAndMarketDataWithThrottling } from '@/lib/data/events'
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
    
    console.log("Starting throttled Polymarket all events data sync...")
    
    // Use the new throttled function to update all events and market data
    const { 
      insertedEvents, 
      insertedMarkets, 
      totalFetched, 
      totalRequests, 
      errors 
    } = await updatePolymarketAllEventsAndMarketDataWithThrottling({
      limit: 100,           // Fetch 100 events per request
      delayMs: 1000,        // Wait 1 second between requests
      maxRetries: 3,        // Retry failed requests up to 3 times
      retryDelayMs: 2000,   // Wait 2 seconds before retry
      timeoutMs: 30000,     // 30 second timeout per request
      userAgent: "BetterAI/1.0"
    })
    
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
          total_fetched: totalFetched,
          total_requests: totalRequests,
          errors_count: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          metadata
        }
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update all Polymarket events error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } as ApiResponse),
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