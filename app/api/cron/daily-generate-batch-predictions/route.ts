import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { runBatchPredictionGeneration } from '@/lib/services/generate-batch-predictions'
import { sendHeartbeatSafe, HeartbeatType } from '@/lib/services/heartbeat'
import { requireCronAuth } from '@/lib/auth/cron-auth'

// Leave headroom under Vercel limit; our code should target < 240s
export const maxDuration = 300


// Input validation function
function validateQueryParams(topMarketsCount: number, endDateRangeHours: number, targetDaysFromNow: number) {
  const errors: string[] = []
  
  // Validate topMarketsCount (1-1000)
  if (isNaN(topMarketsCount) || topMarketsCount < 1 || topMarketsCount > 1000) {
    errors.push('topMarketsCount must be a number between 1 and 1000')
  }
  
  // Validate endDateRangeHours (1-4320 hours = 6 months)
  if (isNaN(endDateRangeHours) || endDateRangeHours < 1 || endDateRangeHours > 4320) {
    errors.push('endDateRangeHours must be a number between 1 and 4320')
  }
  
  // Validate targetDaysFromNow (1-365 days)
  if (isNaN(targetDaysFromNow) || targetDaysFromNow < 1 || targetDaysFromNow > 365) {
    errors.push('targetDaysFromNow must be a number between 1 and 365')
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

    const topMarketsCount = Number(request.nextUrl.searchParams.get('topMarketsCount') ?? 20)
    const endDateRangeHours = Number(request.nextUrl.searchParams.get('endDateRangeHours') ?? 48)
    const targetDaysFromNow = Number(request.nextUrl.searchParams.get('targetDaysFromNow') ?? 7)
    const modelNameParam = request.nextUrl.searchParams.get('modelName') || undefined
    const concurrencyParam = Number(request.nextUrl.searchParams.get('concurrencyPerModel') ?? 3)

    // Validate query parameters
    const validationErrors = validateQueryParams(topMarketsCount, endDateRangeHours, targetDaysFromNow)
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

    const modelList = [
      'openai/gpt-oss-120b',
      'google/gemini-2.5-flash',
      'deepseek/deepseek-chat-v3-0324',
      'openai/gpt-4o-mini',
    ]

    const modelsToRun = Array.from(new Set(modelNameParam ? [...modelList, modelNameParam] : modelList))

    // Run models concurrently but with a safeguard to avoid exhausting runtime
    const perModelConfig = { topMarketsCount, endDateRangeHours, targetDaysFromNow, categoryMix: false, concurrencyPerModel: Math.max(1, Math.min(concurrencyParam, 6)) }
    await Promise.all(modelsToRun.map((modelName) => runBatchPredictionGeneration(perModelConfig, modelName)))

    // Send heartbeat to BetterStack on successful completion
    await sendHeartbeatSafe(HeartbeatType.BATCH_PREDICTIONS)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch generation started for top ${topMarketsCount} markets using ${modelsToRun.length} model(s) at concurrency ${perModelConfig.concurrencyPerModel}`,
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Generate batch predictions error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate batch predictions' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}


