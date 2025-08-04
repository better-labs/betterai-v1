import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/data/events'
import { getMarketsByEventId } from '@/lib/data/markets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EventIcon } from '@/components/event-icon'
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Tag, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { formatVolume } from '@/lib/utils'

interface EventDetailPageProps {
  params: Promise<{
    eventId: string
  }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params

  // Fetch event data
  const event = await getEventById(eventId)
  if (!event) {
    notFound()
  }

  // Fetch markets for this event
  const markets = await getMarketsByEventId(eventId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/events">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <EventIcon 
              icon={event.icon} 
              title={event.title} 
              size="lg" 
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {event.title}
              </h1>
              {event.description && (
                <p className="text-muted-foreground mb-4">
                  {event.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {event.id}
                </Badge>
                {event.trendingRank && event.trendingRank > 0 && (
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending #{event.trendingRank}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Event Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="font-semibold">{formatVolume(Number(event.volume) || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Markets</p>
                <p className="font-semibold">{markets.length}</p>
              </div>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Event Details
            </CardTitle>
            <CardDescription>
              Complete information about this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Event ID</h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {event.id}
              </p>
            </div>
            
            {event.slug && (
              <div>
                <h4 className="font-medium mb-2">Slug</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {event.slug}
                </p>
              </div>
            )}

            {event.tags && Array.isArray(event.tags) && event.tags.length > 0 ? (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag: unknown, index: number) => {
                    let tagText = 'Unknown'
                    if (typeof tag === 'string') {
                      tagText = tag
                    } else if (tag && typeof tag === 'object' && tag !== null) {
                      const tagObj = tag as Record<string, unknown>
                      tagText = (tagObj.label || tagObj.slug || tagObj.name || 'Unknown') as string
                    }
                    return (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tagText}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <h4 className="font-medium mb-2">Last Updated</h4>
              <p className="text-sm text-muted-foreground">
                {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Markets Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Markets ({markets.length})
            </CardTitle>
            <CardDescription>
              All markets associated with this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {markets.length > 0 ? (
              <div className="space-y-4">
                {markets.map((market) => (
                  <div key={market.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{market.question}</h3>
                      <Badge variant={market.active ? "default" : "secondary"}>
                        {market.active ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    
                    {market.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {market.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Volume: {formatVolume(Number(market.volume) || 0)}
                      </span>
                      <span className="text-muted-foreground">
                        Liquidity: {formatVolume(Number(market.liquidity) || 0)}
                      </span>
                      {market.endDate && (
                        <span className="text-muted-foreground">
                          Ends: {new Date(market.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/market/${market.id}`}>
                          View Market
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No markets found for this event.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/events">
              Back to Events
            </Link>
          </Button>
          {markets.length > 0 && (
            <Button variant="outline" asChild>
              <Link href="/">
                View All Markets
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 