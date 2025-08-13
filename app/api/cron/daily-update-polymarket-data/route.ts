import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { updatePolymarketEventsAndMarketData } from '@/lib/services/updatePolymarketEventsAndMarketData'


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = request.nextUrl

    // Defaults from env with sensible fallbacks
    const defaultLimit = Number(process.env.POLYMARKET_UPDATE_LIMIT ?? 100)
    const defaultDelayMs = Number(process.env.POLYMARKET_UPDATE_DELAY_MS ?? 1000)
    const defaultDaysPast = Number(process.env.POLYMARKET_UPDATE_DAYS_PAST ?? 8)
    const defaultDaysFuture = Number(process.env.POLYMARKET_UPDATE_DAYS_FUTURE ?? 21)
    const defaultMaxRetries = Number(process.env.POLYMARKET_UPDATE_MAX_RETRIES ?? 3)
    const defaultRetryDelayMs = Number(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS ?? 2000)
    const defaultTimeoutMs = Number(process.env.POLYMARKET_UPDATE_TIMEOUT_MS ?? 30000)
    const defaultUserAgent = process.env.POLYMARKET_UPDATE_USER_AGENT || 'BetterAI/1.0'
    const defaultMaxBatchFailures = Number(process.env.POLYMARKET_UPDATE_MAX_BATCH_FAILURES ?? 3)

    // Allow query param overrides for ad-hoc runs
    const limit = Number(url.searchParams.get('limit') ?? defaultLimit)
    const delayMs = Number(url.searchParams.get('delayMs') ?? defaultDelayMs)
    const daysToFetchPast = Number(url.searchParams.get('daysToFetchPast') ?? defaultDaysPast)
    const daysToFetchFuture = Number(url.searchParams.get('daysToFetchFuture') ?? defaultDaysFuture)
    const maxRetries = Number(url.searchParams.get('maxRetries') ?? defaultMaxRetries)
    const retryDelayMs = Number(url.searchParams.get('retryDelayMs') ?? defaultRetryDelayMs)
    const timeoutMs = Number(url.searchParams.get('timeoutMs') ?? defaultTimeoutMs)
    const userAgent = url.searchParams.get('userAgent') || defaultUserAgent
    const maxBatchFailuresBeforeAbort = Number(url.searchParams.get('maxBatchFailuresBeforeAbort') ?? defaultMaxBatchFailures)

    const result = await updatePolymarketEventsAndMarketData({
      limit,
      delayMs,
      maxRetries,
      retryDelayMs,
      timeoutMs,
      userAgent,
      daysToFetchPast,
      daysToFetchFuture,
      maxBatchFailuresBeforeAbort,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Polymarket data update completed. Requests: ${result.totalRequests}, Total fetched events: ${result.totalFetched}, Upserted: ${result.insertedEvents.length} events / ${result.insertedMarkets.length} markets` ,
        data: {
          totalRequests: result.totalRequests,
          totalFetched: result.totalFetched,
          insertedEvents: result.insertedEvents.length,
          insertedMarkets: result.insertedMarkets.length,
          errors: result.errors.slice(0, 10),
        }
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Daily Polymarket update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update Polymarket data' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}


