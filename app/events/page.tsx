import { getTrendingEvents } from '@/lib/data/events'
import { getMarketsByEventId } from '@/lib/data/markets'
import type { Event, Market } from '@/lib/types'
import { formatVolume } from '@/lib/utils'

// Server Component - Direct data function usage
export default async function EventsPage() {
  const events = await getTrendingEvents()
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trending Events</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

// Client Component for individual event cards
async function EventCard({ event }: { event: Event }) {
  const markets = await getMarketsByEventId(event.id)
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
      {event.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {event.description}
        </p>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Volume: {formatVolume(Number(event.volume) || 0)}
        </span>
        {event.trendingRank && event.trendingRank > 0 && (
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
            Trending #{event.trendingRank}
          </span>
        )}
      </div>
      
      {markets.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Markets ({markets.length})</h3>
          <div className="space-y-2">
            {markets.slice(0, 3).map((market) => (
              <div key={market.id} className="text-sm">
                <div className="font-medium">{market.question}</div>
                <div className="text-gray-500">
                  Volume: {formatVolume(Number(market.volume) || 0)}
                </div>
              </div>
            ))}
            {markets.length > 3 && (
              <div className="text-sm text-gray-500">
                +{markets.length - 3} more markets
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 