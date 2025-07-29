"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Users, Calendar, BarChart2 } from "lucide-react"
import { PredictionModal } from "@/components/prediction-modal"
import { AdvancedPredictionPanel } from "@/components/advanced-prediction-panel"
import { MarketList } from "@/components/market-list"
import { Event, Market, PredictionResult, ThinkingState } from "@/lib/types"

export function MarketTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set())

  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({})
  const [loadingPredictions, setLoadingPredictions] = useState<Set<string>>(new Set())
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
  const [selectedDataSources, setSelectedDataSources] = useState<Record<string, string[]>>({})
  const [modalOpen, setModalOpen] = useState<Record<string, boolean>>({})
  const [thinkingStates, setThinkingStates] = useState<Record<string, ThinkingState>>({})

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

      const defaultModels: Record<string, string> = {}
      const defaultDataSources: Record<string, string[]> = {}
      data.events.forEach((event: Event) => {
        event.markets.forEach((market: Market) => {
          defaultModels[market.id] = "gpt-4o"
          defaultDataSources[market.id] = ["news"]
        })
      })
      setSelectedModels(defaultModels)
      setSelectedDataSources(defaultDataSources)
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

  const toggleMarketRow = (marketId: string) => {
    const newExpanded = new Set(expandedMarkets)
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId)
    } else {
      newExpanded.add(marketId)
    }
    setExpandedMarkets(newExpanded)
  }

  const handlePredict = async (market: Market) => {
    setModalOpen({ ...modalOpen, [market.id]: true })
    setThinkingStates({
      ...thinkingStates,
      [market.id]: { isThinking: true, message: "Initializing AI analysis...", progress: 0 },
    })

    try {
      const response = await fetch("/api/predict-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          question: market.question,
          model: selectedModels[market.id],
          dataSources: selectedDataSources[market.id] || ["news"],
        }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "thinking") {
                setThinkingStates(prev => ({
                  ...prev,
                  [market.id]: { isThinking: true, message: data.message, progress: data.progress || 0 },
                }))
              } else if (data.type === "result") {
                setThinkingStates(prev => ({
                  ...prev,
                  [market.id]: { isThinking: false, message: "", progress: 100 },
                }))
                setPredictions(prev => ({ ...prev, [market.id]: data.prediction }))
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Prediction failed:", error)
      setThinkingStates(prev => ({
        ...prev,
        [market.id]: { isThinking: false, message: "", progress: 0 },
      }))
    }
  }

  const closeModal = (marketId: string) => {
    setModalOpen({ ...modalOpen, [marketId]: false })
  }

  const handleDataSourceChange = (marketId: string, sourceId: string, checked: boolean) => {
    const currentSources = selectedDataSources[marketId] || []
    if (checked) {
      setSelectedDataSources({
        ...selectedDataSources,
        [marketId]: [...currentSources, sourceId],
      })
    } else {
      setSelectedDataSources({
        ...selectedDataSources,
        [marketId]: currentSources.filter(id => id !== sourceId),
      })
    }
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
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4 mr-2" />
          Top Events
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {events.map(event => (
          <div key={event.id} className="border-b last:border-b-0">
            {/* Event Row */}
            <div
              className="grid grid-cols-12 gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleEventRow(event.id)}
            >
              <div className="col-span-1 flex items-center" data-testid="event-expand">
                {expandedEvents.has(event.id) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="ml-4" data-testid="event-icon">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground" data-testid="event-icon-text">
                      {event.title.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-4" data-testid="event-title">
                <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
              </div>
              <div className="col-span-1 flex items-center" data-testid="event-category">
                <Badge variant="outline">{event.category}</Badge>
              </div>
              <div className="col-span-2 flex items-center justify-center" data-testid="event-volume">
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{event.markets.reduce((sum, market) => sum + market.volume, 0).toLocaleString()} 24hr Volume</span>
                </div>
              </div>
              <div className="col-span-3 flex items-center justify-end text-sm text-muted-foreground" data-testid="event-markets">
                <BarChart2 className="h-4 w-4 mr-2" />
                {event.markets.length} Related Market{event.markets.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Expanded Area for Markets */}
            {expandedEvents.has(event.id) && (
              <MarketList
                markets={event.markets}
                expandedMarkets={expandedMarkets}
                onToggleMarket={toggleMarketRow}
                selectedModels={selectedModels}
                onModelChange={(marketId, modelId) =>
                  setSelectedModels({ ...selectedModels, [marketId]: modelId })
                }
                selectedDataSources={selectedDataSources}
                onDataSourceChange={handleDataSourceChange}
                onPredict={handlePredict}
                loadingPredictions={loadingPredictions}
                predictions={predictions}
              />
            )}
          </div>
        ))}
      </div>

      {/* Prediction Modals */}
      {events.flatMap(event => event.markets).map(market => (
        <PredictionModal
          key={`modal-${market.id}`}
          isOpen={modalOpen[market.id] || false}
          onClose={() => closeModal(market.id)}
          market={market}
          isThinking={thinkingStates[market.id]?.isThinking || false}
          thinkingMessage={thinkingStates[market.id]?.message || ""}
          progress={thinkingStates[market.id]?.progress || 0}
          prediction={predictions[market.id] || null}
        />
      ))}
    </div>
  )
}
