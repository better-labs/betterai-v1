import { NextRequest } from 'next/server'
import { getMarketsByEventId, getMarketById, createMarket, updateMarket, deleteMarket } from '@/lib/data/markets'
import type { ApiResponse, NewMarket } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const eventId = searchParams.get('eventId')

    if (id) {
      const market = await getMarketById(id)
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
    }

    if (eventId) {
      const markets = await getMarketsByEventId(eventId)
      return new Response(
        JSON.stringify({ success: true, data: markets } as ApiResponse),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Default: get all markets
    const markets = await getMarketsByEventId('')
    return new Response(
      JSON.stringify({ success: true, data: markets } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Markets API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const marketData: NewMarket = await request.json()
    const market = await createMarket(marketData)
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const marketData = await request.json()
    const market = await updateMarket(id, marketData)
    
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const success = await deleteMarket(id)
    
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