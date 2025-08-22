import { NextRequest } from 'next/server'
import { marketQueries, NewMarket } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'
import { serializeDecimals } from '@/lib/serialization'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const eventId = searchParams.get('eventId')

    if (id) {
      const market = await marketQueries.getMarketById(id)
      if (!market) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Market not found',
          timestamp: new Date().toISOString()
        }
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      const responseData: ApiResponse = {
        success: true,
        data: serializeDecimals(market),
        timestamp: new Date().toISOString()
      }
      
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (eventId) {
      const markets = await marketQueries.getMarketsByEventId(eventId)
      const responseData: ApiResponse = {
        success: true,
        data: serializeDecimals(markets),
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Default: get all markets
    const markets = await marketQueries.getMarketsByEventId('')
    const responseData: ApiResponse = {
      success: true,
      data: serializeDecimals(markets),
      timestamp: new Date().toISOString()
    }
    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Markets API error:', error)
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const marketData: NewMarket = await request.json()
    const market = await marketQueries.createMarket(marketData)
    return new Response(
      JSON.stringify({ success: true, data: market } as ApiResponse),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit for market write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('marketWrite', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const marketData = await request.json()
    const market = await marketQueries.updateMarket(id, marketData)
    
    if (!market) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: market } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit for market write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('marketWrite', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const success = await marketQueries.deleteMarket(id)
    
    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Market deleted' } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 