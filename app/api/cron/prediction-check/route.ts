import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { generatePredictionVsMarketDelta } from '@/lib/services/prediction-checker'
import { sendHeartbeatSafe, HeartbeatType } from '@/lib/services/heartbeat'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const maxDuration = 300


// Input validation function
function validateQueryParams(daysLookback: number, maxPredictions: number) {
  const errors: string[] = []
  
  // Validate daysLookback (1-365 days)
  if (isNaN(daysLookback) || daysLookback < 1 || daysLookback > 365) {
    errors.push('daysLookback must be a number between 1 and 365')
  }
  
  // Validate maxPredictions (1-10000)
  if (isNaN(maxPredictions) || maxPredictions < 1 || maxPredictions > 10000) {
    errors.push('maxPredictions must be a number between 1 and 10000')
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

    const daysLookback = Number(request.nextUrl.searchParams.get('daysLookback') ?? 30)
    const maxPredictions = Number(request.nextUrl.searchParams.get('maxPredictions') ?? 200)
    const includeClosedMarkets = (request.nextUrl.searchParams.get('includeClosedMarkets') ?? 'false') === 'true'
    const excludeCategoriesParam = request.nextUrl.searchParams.getAll('excludeCategories')
    const excludeCategories = excludeCategoriesParam.length
      ? excludeCategoriesParam
      : []

    // Validate query parameters
    const validationErrors = validateQueryParams(daysLookback, maxPredictions)
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
    generatePredictionVsMarketDelta({
      daysLookback,
      maxPredictions,
      includeClosedMarkets,
      excludeCategories,
    }).then((result) => {
      sendHeartbeatSafe(HeartbeatType.PREDICTION_CHECK)
      console.log(`Prediction check completed: checked ${result.checkedCount}, saved ${result.savedCount}`)
    }).catch((error) => {
      console.error('Prediction check error:', error)
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Prediction check started for ${maxPredictions} predictions over ${daysLookback} days`,
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Prediction check error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to run prediction checks' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
