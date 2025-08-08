import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { runBatchPredictionGeneration } from '@/lib/services/generate-batch-predictions'
import { DEFAULT_MODEL } from '@/lib/db/queries'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let body: any = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = {}
    }

    const {
      topMarketsCount = 20,
      endDateRangeHours = 24,
      targetDaysFromNow = 7,
      modelName = DEFAULT_MODEL,
    } = body || {}

    await runBatchPredictionGeneration(
      { topMarketsCount, endDateRangeHours, targetDaysFromNow },
      modelName
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch prediction generation enqueued for top ${topMarketsCount} markets using ${modelName}`,
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Batch prediction generation endpoint. Use POST to trigger.',
    } as ApiResponse),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
