import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { updateActivePolymarketEvents } from '@/lib/services/updateActivePolymarketEvents'
import { sendHeartbeatSafe, HeartbeatType } from '@/lib/services/heartbeat'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const maxDuration = 300

function validateQueryParams(
  delayMs: number,
  maxRetries: number,
  retryDelayMs: number,
  timeoutMs: number,
  maxBatchFailuresBeforeAbort: number
) {
  const errors: string[] = []
  
  if (isNaN(delayMs) || delayMs < 0 || delayMs > 10000) {
    errors.push('delayMs must be a number between 0 and 10000')
  }
  
  if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 10) {
    errors.push('maxRetries must be a number between 0 and 10')
  }
  
  if (isNaN(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 30000) {
    errors.push('retryDelayMs must be a number between 0 and 30000')
  }
  
  if (isNaN(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
    errors.push('timeoutMs must be a number between 1000 and 300000')
  }
  
  if (isNaN(maxBatchFailuresBeforeAbort) || maxBatchFailuresBeforeAbort < 1 || maxBatchFailuresBeforeAbort > 100) {
    errors.push('maxBatchFailuresBeforeAbort must be a number between 1 and 100')
  }
  
  return errors
}

export async function GET(request: NextRequest) {
  try {
    const authResponse = requireCronAuth(request)
    if (authResponse) {
      return authResponse
    }

    const url = request.nextUrl

    // Defaults from env with sensible fallbacks
    const defaultDelayMs = Number(process.env.POLYMARKET_UPDATE_DELAY_MS ?? 500)
    const defaultMaxRetries = Number(process.env.POLYMARKET_UPDATE_MAX_RETRIES ?? 3)
    const defaultRetryDelayMs = Number(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS ?? 2000)
    const defaultTimeoutMs = Number(process.env.POLYMARKET_UPDATE_TIMEOUT_MS ?? 30000)
    const defaultUserAgent = process.env.POLYMARKET_UPDATE_USER_AGENT || 'BetterAI/1.0'
    const defaultMaxBatchFailures = Number(process.env.POLYMARKET_UPDATE_MAX_BATCH_FAILURES ?? 3)

    // Allow query param overrides for ad-hoc runs
    const delayMs = Number(url.searchParams.get('delayMs') ?? defaultDelayMs)
    const maxRetries = Number(url.searchParams.get('maxRetries') ?? defaultMaxRetries)
    const retryDelayMs = Number(url.searchParams.get('retryDelayMs') ?? defaultRetryDelayMs)
    const timeoutMs = Number(url.searchParams.get('timeoutMs') ?? defaultTimeoutMs)
    const userAgent = url.searchParams.get('userAgent') || defaultUserAgent
    const maxBatchFailuresBeforeAbort = Number(url.searchParams.get('maxBatchFailuresBeforeAbort') ?? defaultMaxBatchFailures)

    // Validate query parameters
    const validationErrors = validateQueryParams(
      delayMs,
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

    // Run async - don't await to avoid timeouts, let background processing continue
    updateActivePolymarketEvents({
      delayMs,
      maxRetries,
      retryDelayMs,
      timeoutMs,
      userAgent,
      maxBatchFailuresBeforeAbort,
    }).then((result) => {
      sendHeartbeatSafe(HeartbeatType.POLYMARKET_DATA)
      console.log(`Active events update completed: ${result.activeEventsCount} active, ${result.updatedEvents.length} events updated, ${result.updatedMarkets.length} markets updated`)
    }).catch((error) => {
      console.error('Active events update error:', error)
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Active events update started with ${maxBatchFailuresBeforeAbort} max batch failures`,
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Active events update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update active events data' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}