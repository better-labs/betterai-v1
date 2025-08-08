import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { runDailyPredictionChecks } from '@/lib/services/prediction-checker'

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

    const daysLookback = Number(request.nextUrl.searchParams.get('daysLookback') ?? 30)
    const maxPredictions = Number(request.nextUrl.searchParams.get('maxPredictions') ?? 200)
    const includeClosedMarkets = (request.nextUrl.searchParams.get('includeClosedMarkets') ?? 'false') === 'true'
    const excludeCategoriesParam = request.nextUrl.searchParams.getAll('excludeCategories')
    const excludeCategories = excludeCategoriesParam.length
      ? excludeCategoriesParam
      : []

    const result = await runDailyPredictionChecks({
      daysLookback,
      maxPredictions,
      includeClosedMarkets,
      excludeCategories,
    })

    const sample = result.results.slice(0, 20)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${result.checkedCount} predictions; saved ${result.savedCount} results`,
        data: {
          checkedCount: result.checkedCount,
          savedCount: result.savedCount,
          sample,
        },
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
