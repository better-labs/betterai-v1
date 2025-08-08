import { NextRequest } from 'next/server'
import { updatePolymarketEventsAndMarketData } from '@/lib/services/events'
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

    // Parse request body for optional parameters
    let requestBody: { daysToFetch?: number } = {}
    try {
      const body = await request.text()
      if (body) {
        requestBody = JSON.parse(body)
      }
    } catch (error) {
      // If body parsing fails, use default values
      console.log('No request body or invalid JSON, using defaults')
    }

    const daysToFetch = requestBody.daysToFetch || 8
    const startTime = Date.now()
    
    console.log(`Starting throttled Polymarket events data sync with daysToFetch=${daysToFetch}...`)
    
    // Use the new throttled function to update all events and market data
    const { 
      insertedEvents, 
      insertedMarkets, 
      totalFetched, 
      totalRequests, 
      errors 
    } = await updatePolymarketEventsAndMarketData({
      limit: 200,           // Fetch 200 events per request
      delayMs: 1000,        // Wait 1 second between requests
      maxRetries: 3,        // Retry failed requests up to 3 times
      retryDelayMs: 2000,   // Wait 2 seconds before retry
      timeoutMs: 30000,     // 30 second timeout per request
      userAgent: "BetterAI/1.0",
      daysToFetch: daysToFetch
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
        message: `Successfully synced ${insertedEvents.length} events and ${insertedMarkets.length} markets from Polymarket (${daysToFetch} days range)`,
        data: {
          duration: `${duration}ms`,
          events_count: insertedEvents.length,
          markets_count: insertedMarkets.length,
          total_fetched: totalFetched,
          total_requests: totalRequests,
          errors_count: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          days_to_fetch: daysToFetch,
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
      message: 'Update Polymarket events and market data endpoint',
      data: {
        method: 'POST',
        description: 'Updates events and markets from Polymarket with configurable date range',
        parameters: {
          daysToFetch: {
            type: 'number',
            optional: true,
            default: 10,
            description: 'Number of days to fetch events for (past and future)'
          }
        }
      }
    } as ApiResponse),
    { headers: { 'Content-Type': 'application/json' } }
  )
} 