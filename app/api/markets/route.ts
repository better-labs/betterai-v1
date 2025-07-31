import { NextRequest } from 'next/server'
import { 
  getMarketsByEventId, 
  getMarketById, 
  getHighVolumeMarkets,
  createMarket, 
  updateMarket, 
  deleteMarket 
} from '@/lib/data/markets'
import type { ApiResponse, NewMarket } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const eventId = searchParams.get('eventId')
    const highVolume = searchParams.get('highVolume')

    if (id) {
      const market = await getMarketById(id)
      if (!market) {
        return Response.json(
          { success: false, error: 'Market not found' } as ApiResponse,
          { status: 404 }
        )
      }
      return Response.json({ success: true, data: market } as ApiResponse)
    }

    if (eventId) {
      const markets = await getMarketsByEventId(eventId)
      return Response.json({ success: true, data: markets } as ApiResponse)
    }

    if (highVolume === 'true') {
      const limit = parseInt(searchParams.get('limit') || '20')
      const markets = await getHighVolumeMarkets(limit)
      return Response.json({ success: true, data: markets } as ApiResponse)
    }

    // Default: get high volume markets
    const markets = await getHighVolumeMarkets()
    return Response.json({ success: true, data: markets } as ApiResponse)
  } catch (error) {
    console.error('Markets API error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const marketData: NewMarket = await request.json()
    const market = await createMarket(marketData)
    return Response.json({ success: true, data: market } as ApiResponse, { status: 201 })
  } catch (error) {
    console.error('Create market error:', error)
    return Response.json(
      { success: false, error: 'Failed to create market' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json(
        { success: false, error: 'Market ID required' } as ApiResponse,
        { status: 400 }
      )
    }

    const marketData = await request.json()
    const market = await updateMarket(id, marketData)
    
    if (!market) {
      return Response.json(
        { success: false, error: 'Market not found' } as ApiResponse,
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: market } as ApiResponse)
  } catch (error) {
    console.error('Update market error:', error)
    return Response.json(
      { success: false, error: 'Failed to update market' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json(
        { success: false, error: 'Market ID required' } as ApiResponse,
        { status: 400 }
      )
    }

    const deleted = await deleteMarket(id)
    
    if (!deleted) {
      return Response.json(
        { success: false, error: 'Market not found' } as ApiResponse,
        { status: 404 }
      )
    }

    return Response.json({ success: true, message: 'Market deleted' } as ApiResponse)
  } catch (error) {
    console.error('Delete market error:', error)
    return Response.json(
      { success: false, error: 'Failed to delete market' } as ApiResponse,
      { status: 500 }
    )
  }
} 