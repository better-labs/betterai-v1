"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Users, Calendar, BarChart2 } from "lucide-react"
import { MarketList } from "@/components/market-list"
import { EventIcon } from "@/components/event-icon"
import { EventWithMarkets, Market, PredictionResult } from "@/lib/types"
import { formatVolume } from "@/lib/utils"

export function EventTable() {
  const [events, setEvents] = useState<EventWithMarkets[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({})

  useEffect(() => {
    fetchTrendingEvents()
  }, [])

  const fetchTrendingEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/markets/trending")
      const data = await response.json()
      if (!data.events || data.events.length === 0) {
        throw new Error("No events data in payload")
      }
      setEvents(data.events)

      // Automatically expand the first event
      if (data.events.length > 0) {
        setExpandedEvents(new Set([data.events[0].id]))
      }
    } catch (error) {
      console.error("Failed to fetch trending events:", error)
      // Fallback to empty state or mock can be handled here
    } finally {
      setLoading(false)
    }
  }

  const toggleEventRow = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-black">Trending Events</h2>
          <Badge variant="secondary" className="bg-[#4B9CD3]/10 text-[#4B9CD3]">
            <TrendingUp className="h-3 w-3 mr-1" />
            Top Events
          </Badge>
        </div>
        <div className="border rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Trending Events</h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary shadow-sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Top Events
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {events.map(event => (
          <div key={event.id} className="border-b last:border-b-0" data-testid={`event-row-${event.id}`}>
            {/* Event Row */}
            <div className="p-4 space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4" data-testid={`event-content-${event.id}`}>
              {/* Expand/Collapse Button - 1 col on desktop */}
              <div className="md:col-span-1 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEventRow(event.id)}
                  className="p-1 hover:bg-muted/50 transition-colors"
                  data-testid={`event-toggle-${event.id}`}
                >
                  {expandedEvents.has(event.id) ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div data-testid="event-icon">
                    <EventIcon 
                      icon={event.icon} 
                      title={event.title} 
                      size="md"
                    />
                  </div>
                </Button>
              </div>

              {/* Event Title - Full width on mobile, 4 cols on desktop */}
              <div className="md:col-span-4" data-testid="event-title">
                <h3 className="font-semibold text-base md:text-lg text-foreground leading-tight">{event.title}</h3>
              </div>

              {/* Event Details - Stack on mobile, grid on desktop */}
              <div className="flex flex-col space-y-2 md:col-span-7 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                {/* Tags Badges */}
                <div className="flex items-center gap-1" data-testid="event-tags">
                  {event.tags && Array.isArray(event.tags) && event.tags.length > 0 ? (
                    event.tags.slice(0, 3).map((tag, index) => (
                      <Badge 
                        key={tag.id || index} 
                        variant="outline" 
                        className="text-xs md:text-sm shadow-sm"
                      >
                        {tag.label}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs md:text-sm shadow-sm">
                      No Tags
                    </Badge>
                  )}
                </div>

                {/* Volume */}
                <div className="flex items-center text-sm text-muted-foreground" data-testid="event-volume">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span className="text-xs md:text-sm">
                    {formatVolume(event.markets.reduce((sum, market) => sum + (Number(market.volume) || 0), 0))} 24hr Volume
                  </span>
                </div>

                {/* Related Markets */}
                <div className="flex items-center text-sm text-muted-foreground" data-testid="event-markets">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  <span className="text-xs md:text-sm">
                    {event.markets.length} Related Market{event.markets.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Area for Markets */}
            {expandedEvents.has(event.id) && (
              <MarketList
                markets={event.markets}
                predictions={predictions}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
