import { getTrendingEvents } from '@/lib/data/events'
import { getMarketsByEventId } from '@/lib/data/markets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EventIcon } from '@/components/event-icon'
import { TrendingUp, BarChart2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Event, Market } from '@/lib/types'
import { formatVolume } from '@/lib/utils'

// Server Component - Direct data function usage
export default async function EventsPage() {
  const events = await getTrendingEvents()
  
  // Fetch markets for all events
  const eventsWithMarkets = await Promise.all(
    events.map(async (event) => {
      const markets = await getMarketsByEventId(event.id)
      return { event, markets }
    })
  )
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trending Events</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventsWithMarkets.map(({ event, markets }) => (
          <EventCard key={event.id} event={event} markets={markets} />
        ))}
      </div>
    </div>
  )
}

// Server Component for individual event cards
function EventCard({ event, markets }: { event: Event; markets: Market[] }) {
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <EventIcon 
            icon={event.icon} 
            title={event.title} 
            size="md" 
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              <Link href={`/event/${event.id}`} className="hover:text-primary transition-colors">
                {event.title}
              </Link>
            </CardTitle>
            {event.description && (
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Volume: {formatVolume(Number(event.volume) || 0)}
          </span>
          
        </div>
        
        {markets.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                Markets ({markets.length})
              </h3>
            </div>
            <div className="space-y-2">
              {markets.slice(0, 3).map((market) => (
                <div key={market.id} className="text-sm">
                  <div className="font-medium line-clamp-1">{market.question}</div>
                  <div className="text-muted-foreground">
                    Volume: {formatVolume(Number(market.volume) || 0)}
                  </div>
                </div>
              ))}
              {markets.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{markets.length - 3} more markets
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/event/${event.id}`} className="flex items-center gap-2">
              View Event Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 