import { NextRequest } from 'next/server'
import { updatePolymarketEventsAndMarketData } from '@/lib/services/events'
import type { ApiResponse, DatabaseMetadata } from '@/lib/types'

export async function POST() {
  return new Response(
    JSON.stringify({ success: false, error: 'Use GET for this cron endpoint' } as ApiResponse),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  )
}


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const daysToFetchParam = request.nextUrl.searchParams.get('daysToFetch')
    const daysToFetch = daysToFetchParam ? Number(daysToFetchParam) : 8

    const startTime = Date.now()

    const { insertedEvents, insertedMarkets, totalFetched, totalRequests, errors } =
      await updatePolymarketEventsAndMarketData({
        limit: 200,
        delayMs: 1000,
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 30000,
        userAgent: 'BetterAI/1.0',
        daysToFetch,
      })

    const duration = Date.now() - startTime

    const metadata: DatabaseMetadata = {
      database: 'neon',
      orm: 'drizzle',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
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
          metadata,
        },
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update all Polymarket events error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}