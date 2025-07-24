"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Users, Calendar, BarChart2 } from "lucide-react"
import { PredictionModal } from "@/components/prediction-modal"
import { AdvancedPredictionPanel } from "@/components/advanced-prediction-panel"

// Interfaces to represent the new data structure
interface Event {
  id: string
  title: string
  category: string
  markets: Market[]
}

interface Market {
  id: string
  question: string
  description: string
  volume: number
  liquidity: number
  outcomes: Array<{
    name: string
    price: number
  }>
  endDate: string
  category: string
  marketURL: string
}

interface PredictionResult {
  prediction: string
  confidence: number
  reasoning: string
  recommendedOutcome: string
  riskLevel: "Low" | "Medium" | "High"
}

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
  const [thinkingStates, setThinkingStates] = useState<
    Record<string, { isThinking: boolean; message: string; progress: number }>
  >({})

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
              <div className="col-span-1 flex items-center">
                {expandedEvents.has(event.id) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="col-span-6">
                <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
              </div>
              <div className="col-span-2 flex items-center">
                <Badge variant="outline">{event.category}</Badge>
              </div>
              <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                <BarChart2 className="h-4 w-4 mr-2" />
                {event.markets.length} Related Market{event.markets.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Expanded Area for Markets */}
            {expandedEvents.has(event.id) && (
              <div className="pl-8 pr-4 pb-4 bg-muted/20">
                {event.markets.map(market => (
                  <div key={market.id} className="border-t">
                    {/* Market Row */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                      <div className="col-span-6">
                        <h4 className="font-medium text-foreground">{market.question}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>${(market.volume / 1000).toFixed(0)}k Vol</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center space-x-2">
                        {market.outcomes.slice(0, 2).map((outcome, idx) => (
                          <div key={idx} className="flex items-center space-x-1">
                            <span className="text-sm font-medium">{outcome.name}</span>
                            <Badge variant="secondary">{(outcome.price * 100).toFixed(0)}¢</Badge>
                          </div>
                        ))}
                      </div>

                      <div className="col-span-3 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePredict(market)}
                          className="flex-1"
                        >
                          Predict
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMarketRow(market.id)}
                        >
                          Advanced
                          {expandedMarkets.has(market.id) ? (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Advanced Prediction Panel for each market */}
                    {expandedMarkets.has(market.id) && (
                      <div className="p-4 bg-muted/30">
                        <AdvancedPredictionPanel
                          market={market}
                          selectedModel={selectedModels[market.id]}
                          onModelChange={modelId =>
                            setSelectedModels({ ...selectedModels, [market.id]: modelId })
                          }
                          selectedDataSources={selectedDataSources[market.id] || []}
                          onDataSourceChange={(sourceId, checked) =>
                            handleDataSourceChange(market.id, sourceId, checked)
                          }
                          onPredict={() => handlePredict(market)}
                          isLoading={loadingPredictions.has(market.id)}
                          prediction={predictions[market.id] || null}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
