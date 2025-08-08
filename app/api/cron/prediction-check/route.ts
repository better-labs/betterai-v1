import { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/types'
import { runDailyPredictionChecks } from '@/lib/services/prediction-checker'

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
      daysLookback = 30,
      maxPredictions = 200,
      includeClosedMarkets = false,
      excludeCategories = [],
    } = body || {}

    const result = await runDailyPredictionChecks({
      daysLookback,
      maxPredictions,
      includeClosedMarkets,
      excludeCategories,
    })

    // Return only a short sample of results to keep payloads small
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
      message: 'Prediction check endpoint. Use POST to run checks.',
    } as ApiResponse),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
