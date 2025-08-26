"use client"

import { EventIcon } from "@/shared/ui/event-icon"
import { formatVolume } from "@/lib/utils"
import { trpc } from "@/shared/providers/trpc-provider"

export function EventList() {
  // Use tRPC to fetch events
  const { data, isLoading, error, refetch } = trpc.events.list.useQuery(
    { limit: 100 },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const events = data?.items || []

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error.message}</div>
        <button 
          onClick={() => refetch()}
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