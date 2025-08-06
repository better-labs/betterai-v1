"use client"

import { useEffect, useState } from "react"
import { Event, ApiResponse } from "@/lib/types"
import { EventIcon } from "@/components/event-icon"
import { formatVolume } from "@/lib/utils"

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const response = await fetch('/api/events')
        const data: ApiResponse<Event[]> = await response.json()
        
        if (data.success && data.data) {
          setEvents(data.data)
        } else {
          setError(data.error || 'Failed to fetch events')
        }
      } catch (err) {
        setError('Network error')
        console.error('Fetch events error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-2">
            <EventIcon 
              icon={event.icon} 
              title={event.title} 
              size="lg"
            />
            <h2 className="text-xl font-semibold">{event.title}</h2>
          </div>
          {event.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {event.description}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Volume: {formatVolume(Number(event.volume) || 0)}
            </span>
            
          </div>
        </div>
      ))}
    </div>
  )
} 