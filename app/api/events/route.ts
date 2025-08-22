import { NextRequest } from 'next/server'
import { eventQueries, NewEvent } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'
import { serializeDecimals } from '@/lib/serialization'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (id) {
      const event = await eventQueries.getEventById(id)
      if (!event) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Event not found',
          timestamp: new Date().toISOString()
        }
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      const responseData: ApiResponse = {
        success: true,
        data: serializeDecimals(event),
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (slug) {
      const event = await eventQueries.getEventBySlug(slug)
      if (!event) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Event not found',
          timestamp: new Date().toISOString()
        }
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      const responseData: ApiResponse = {
        success: true,
        data: serializeDecimals(event),
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Default: get trending events
    const events = await eventQueries.getTrendingEvents()
    const responseData: ApiResponse = {
      success: true,
      data: serializeDecimals(events),
      timestamp: new Date().toISOString()
    }
    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Events API error:', error)
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
    const body = await request.json()
    const eventData: NewEvent = body
    const event = await eventQueries.createEvent(eventData)
    return new Response(
      JSON.stringify({ success: true, data: event } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Events API POST error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit for event write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('eventWrite', identifier)
    
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
        JSON.stringify({ success: false, error: 'Event ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const eventData = await request.json()
    const event = await eventQueries.updateEvent(id, eventData)
    
    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: event } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update event error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update event' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit for event write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('eventWrite', identifier)
    
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
        JSON.stringify({ success: false, error: 'Event ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const success = await eventQueries.deleteEvent(id)
    
    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event deleted' } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete event error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete event' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 