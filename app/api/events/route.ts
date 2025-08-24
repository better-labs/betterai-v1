import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as eventService from '@/lib/services/event-service'
import { mapEventToDTO, mapEventsToDTO } from '@/lib/dtos'
import type { ApiResponse } from '@/lib/types'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (id) {
      const eventDto = await eventService.getEventByIdSerialized(prisma, id)
      if (!eventDto) {
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
        data: eventDto,
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (slug) {
      const event = await eventService.getEventBySlug(prisma, slug)
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
      
      const eventDto = mapEventToDTO(event)
      const responseData: ApiResponse = {
        success: true,
        data: eventDto,
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Default: get trending events
    const events = await eventService.getTrendingEvents(prisma)
    const eventDtos = mapEventsToDTO(events)
    const responseData: ApiResponse = {
      success: true,
      data: eventDtos,
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
    const eventData = await request.json()
    const event = await eventService.createEvent(prisma, eventData)
    const eventDto = mapEventToDTO(event)
    return new Response(
      JSON.stringify({ success: true, data: eventDto } as ApiResponse),
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
    const event = await eventService.updateEvent(prisma, id, eventData)
    
    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const eventDto = mapEventToDTO(event)
    return new Response(
      JSON.stringify({ success: true, data: eventDto } as ApiResponse),
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

    const success = await eventService.deleteEvent(prisma, id)
    
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