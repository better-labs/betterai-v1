import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { runBatchPredictionGeneration } from '@/lib/services/generate-batch-predictions'



export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const topMarketsCount = Number(request.nextUrl.searchParams.get('topMarketsCount') ?? 20)
    const endDateRangeHours = Number(request.nextUrl.searchParams.get('endDateRangeHours') ?? 48)
    const targetDaysFromNow = Number(request.nextUrl.searchParams.get('targetDaysFromNow') ?? 7)
    const modelNameParam = request.nextUrl.searchParams.get('modelName') || undefined

    const modelList = [
      'openai/gpt-oss-120b',
      'google/gemini-2.5-flash',
      'deepseek/deepseek-chat-v3-0324',
      'openai/gpt-4o-mini',
    ]

    const modelsToRun = Array.from(new Set(modelNameParam ? [...modelList, modelNameParam] : modelList))

    for (const modelName of modelsToRun) {
      await runBatchPredictionGeneration(
        { topMarketsCount, endDateRangeHours, targetDaysFromNow, categoryMix: false },
        modelName
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch prediction generation enqueued for top ${topMarketsCount} markets using models: ${modelsToRun.join(', ')}`,
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


