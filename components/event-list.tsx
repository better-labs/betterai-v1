'use client'

import { useEffect, useState } from 'react'
import type { Event, ApiResponse } from '@/lib/types'

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
            {event.icon ? (
              <img 
                src={event.icon} 
                alt={event.title}
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center ${event.icon ? 'hidden' : ''}`}>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {event.title.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-semibold">{event.title}</h2>
          </div>
          {event.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {event.description}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Volume: ${Number(event.volume).toLocaleString()}
            </span>
            {event.trendingRank && event.trendingRank > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                Trending #{event.trendingRank}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 