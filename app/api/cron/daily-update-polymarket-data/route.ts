import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { updatePolymarketEventsAndMarketData } from '@/lib/services/updatePolymarketEventsAndMarketData'
import { sendHeartbeatSafe, HeartbeatType } from '@/lib/services/heartbeat'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const maxDuration = 300


// Input validation function
function validateQueryParams(
  batchSize: number,
  delayMs: number,
  daysToFetchPast: number,
  daysToFetchFuture: number,
  maxRetries: number,
  retryDelayMs: number,
  timeoutMs: number,
  maxBatchFailuresBeforeAbort: number
) {
  const errors: string[] = []
  
  // Validate batchSize (1-100) - Security: Prevent dump-style requests
  if (isNaN(batchSize) || batchSize < 1 || batchSize > 100) {
    errors.push('batchSize must be a number between 1 and 100')
  }
  
  // Validate delayMs (0-10000ms)
  if (isNaN(delayMs) || delayMs < 0 || delayMs > 10000) {
    errors.push('delayMs must be a number between 0 and 10000')
  }
  
  // Validate daysToFetchPast (0-365 days)
  if (isNaN(daysToFetchPast) || daysToFetchPast < 0 || daysToFetchPast > 365) {
    errors.push('daysToFetchPast must be a number between 0 and 365')
  }
  
  // Validate daysToFetchFuture (0-365 days)
  if (isNaN(daysToFetchFuture) || daysToFetchFuture < 0 || daysToFetchFuture > 365) {
    errors.push('daysToFetchFuture must be a number between 0 and 365')
  }
  
  // Validate maxRetries (0-10)
  if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 10) {
    errors.push('maxRetries must be a number between 0 and 10')
  }
  
  // Validate retryDelayMs (0-30000ms)
  if (isNaN(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 30000) {
    errors.push('retryDelayMs must be a number between 0 and 30000')
  }
  
  // Validate timeoutMs (1000-300000ms)
  if (isNaN(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
    errors.push('timeoutMs must be a number between 1000 and 300000')
  }
  
  // Validate maxBatchFailuresBeforeAbort (1-100)
  if (isNaN(maxBatchFailuresBeforeAbort) || maxBatchFailuresBeforeAbort < 1 || maxBatchFailuresBeforeAbort > 100) {
    errors.push('maxBatchFailuresBeforeAbort must be a number between 1 and 100')
  }
  
  return errors
}

export async function GET(request: NextRequest) {
  try {
    // Security: Authenticate the request
    const authResponse = requireCronAuth(request)
    if (authResponse) {
      return authResponse
    }

    const url = request.nextUrl

    // Defaults from env with sensible fallbacks (Security: Conservative batch size)
    const defaultBatchSize = Math.min(Number(process.env.POLYMARKET_UPDATE_LIMIT ?? 50), 100)
    const defaultDelayMs = Number(process.env.POLYMARKET_UPDATE_DELAY_MS ?? 1000)
    const defaultDaysPast = Number(process.env.POLYMARKET_UPDATE_DAYS_PAST ?? 8)
    const defaultDaysFuture = Number(process.env.POLYMARKET_UPDATE_DAYS_FUTURE ?? 21)
    const defaultMaxRetries = Number(process.env.POLYMARKET_UPDATE_MAX_RETRIES ?? 3)
    const defaultRetryDelayMs = Number(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS ?? 2000)
    const defaultTimeoutMs = Number(process.env.POLYMARKET_UPDATE_TIMEOUT_MS ?? 30000)
    const defaultUserAgent = process.env.POLYMARKET_UPDATE_USER_AGENT || 'BetterAI/1.0'
    const defaultMaxBatchFailures = Number(process.env.POLYMARKET_UPDATE_MAX_BATCH_FAILURES ?? 3)

    // Allow query param overrides for ad-hoc runs
    const batchSize = Number(url.searchParams.get('batchSize') ?? url.searchParams.get('limit') ?? defaultBatchSize)
    const delayMs = Number(url.searchParams.get('delayMs') ?? defaultDelayMs)
    const daysToFetchPast = Number(url.searchParams.get('daysToFetchPast') ?? defaultDaysPast)
    const daysToFetchFuture = Number(url.searchParams.get('daysToFetchFuture') ?? defaultDaysFuture)
    const maxRetries = Number(url.searchParams.get('maxRetries') ?? defaultMaxRetries)
    const retryDelayMs = Number(url.searchParams.get('retryDelayMs') ?? defaultRetryDelayMs)
    const timeoutMs = Number(url.searchParams.get('timeoutMs') ?? defaultTimeoutMs)
    const userAgent = url.searchParams.get('userAgent') || defaultUserAgent
    const maxBatchFailuresBeforeAbort = Number(url.searchParams.get('maxBatchFailuresBeforeAbort') ?? defaultMaxBatchFailures)
    const sortBy = url.searchParams.get('sortBy') || undefined
    const maxEvents = url.searchParams.get('maxEvents') ?? url.searchParams.get('totalEventLimit')
    const maxEventsNumber = maxEvents ? Number(maxEvents) : undefined

    // Validate query parameters
    const validationErrors = validateQueryParams(
      batchSize,
      delayMs,
      daysToFetchPast,
      daysToFetchFuture,
      maxRetries,
      retryDelayMs,
      timeoutMs,
      maxBatchFailuresBeforeAbort
    )
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid query parameters', 
          details: validationErrors 
        } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await updatePolymarketEventsAndMarketData({
      batchSize,
      delayMs,
      maxRetries,
      retryDelayMs,
      timeoutMs,
      userAgent,
      daysToFetchPast,
      daysToFetchFuture,
      maxBatchFailuresBeforeAbort,
      sortBy,
      maxEvents: maxEventsNumber,
    })

    // Send heartbeat to BetterStack on successful completion
    await sendHeartbeatSafe(HeartbeatType.POLYMARKET_DATA)

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


