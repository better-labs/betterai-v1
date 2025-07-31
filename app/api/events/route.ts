import { NextRequest } from 'next/server'
import { getTrendingEvents, getEventById, createEvent, updateEvent, deleteEvent, updateEventIcon } from '@/lib/data/events'
import type { ApiResponse, NewEvent } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (id) {
      const event = await getEventById(id)
      if (!event) {
        return Response.json(
          { success: false, error: 'Event not found' } as ApiResponse,
          { status: 404 }
        )
      }
      return Response.json({ success: true, data: event } as ApiResponse)
    }

    if (slug) {
      const event = await getEventById(slug)
      if (!event) {
        return Response.json(
          { success: false, error: 'Event not found' } as ApiResponse,
          { status: 404 }
        )
      }
      return Response.json({ success: true, data: event } as ApiResponse)
    }

    // Default: get trending events
    const events = await getTrendingEvents()
    return Response.json({ success: true, data: events } as ApiResponse)
  } catch (error) {
    console.error('Events API error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventId } = body

    // Handle icon update action
    if (action === 'updateIcon' && eventId) {
      const updatedEvent = await updateEventIcon(eventId)
      if (!updatedEvent) {
        return Response.json(
          { success: false, error: 'Failed to update event icon' } as ApiResponse,
          { status: 404 }
        )
      }
      return Response.json({ success: true, data: updatedEvent } as ApiResponse)
    }

    // Handle regular event creation
    const eventData: NewEvent = body
    const event = await createEvent(eventData)
    return Response.json({ success: true, data: event } as ApiResponse)
  } catch (error) {
    console.error('Events API POST error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' } as ApiResponse,
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
        { success: false, error: 'Event ID required' } as ApiResponse,
        { status: 400 }
      )
    }

    const eventData = await request.json()
    const event = await updateEvent(id, eventData)
    
    if (!event) {
      return Response.json(
        { success: false, error: 'Event not found' } as ApiResponse,
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: event } as ApiResponse)
  } catch (error) {
    console.error('Update event error:', error)
    return Response.json(
      { success: false, error: 'Failed to update event' } as ApiResponse,
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
        { success: false, error: 'Event ID required' } as ApiResponse,
        { status: 400 }
      )
    }

    const deleted = await deleteEvent(id)
    
    if (!deleted) {
      return Response.json(
        { success: false, error: 'Event not found' } as ApiResponse,
        { status: 404 }
      )
    }

    return Response.json({ success: true, message: 'Event deleted' } as ApiResponse)
  } catch (error) {
    console.error('Delete event error:', error)
    return Response.json(
      { success: false, error: 'Failed to delete event' } as ApiResponse,
      { status: 500 }
    )
  }
} 