import { NextRequest, NextResponse } from 'next/server'
import { marketQueries, eventQueries } from '@/lib/db/queries'
import type { ApiResponse, MarketDTO, EventDTO } from '@/lib/types'

interface RouteParams {
  params: Promise<{
    marketId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { marketId } = await params

    if (!marketId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Market ID is required',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Fetch market data
    const market = await marketQueries.getMarketByIdSerialized(marketId) as unknown as MarketDTO | null
    
    if (!market) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Market not found',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Fetch related event data if available
    let event: EventDTO | null = null
    if (market.eventId) {
      event = await eventQueries.getEventByIdSerialized(market.eventId) as unknown as EventDTO | null
    }

    const responseData: ApiResponse = {
      success: true,
      data: {
        market,
        event
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching market data:', error)
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch market data',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}