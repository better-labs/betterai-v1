"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Users } from "lucide-react"
import { PredictionModal } from "@/components/prediction-modal"
import { AdvancedPredictionPanel } from "@/components/advanced-prediction-panel"

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
  const [markets, setMarkets] = useState<Market[]>([])
  const [loadingMarketData, setLoadingMarketData] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({})
  const [loadingPredictions, setLoadingPredictions] = useState<Set<string>>(new Set())
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
  const [selectedDataSources, setSelectedDataSources] = useState<Record<string, string[]>>({})
  const [credits, setCredits] = useState(10)
  const [modalOpen, setModalOpen] = useState<Record<string, boolean>>({})
  const [thinkingStates, setThinkingStates] = useState<
    Record<string, { isThinking: boolean; message: string; progress: number }>
  >({})

  useEffect(() => {
    fetchTrendingMarkets()
  }, [])

  const fetchTrendingMarkets = async () => {
    try {
      const response = await fetch("/api/markets/trending")
      const data = await response.json()
      if (!data.markets || data.markets.length === 0) {
        throw new Error("data markets payload empty")
      }
      const marketData = data.markets
      setMarkets(marketData)

      // Initialize default selections for each market
      const defaultModels: Record<string, string> = {}
      const defaultDataSources: Record<string, string[]> = {}

      marketData.forEach((market: Market) => {
        defaultModels[market.id] = "gpt-4o"
        defaultDataSources[market.id] = ["news"]
      })

      setSelectedModels(defaultModels)
      setSelectedDataSources(defaultDataSources)
    } catch (error) {
      console.error("Failed to fetch markets:", error)
      setMarkets(mockMarkets)
    } finally {
      setLoadingMarketData(false)
    }
  }

  const toggleRow = (marketId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId)
    } else {
      newExpanded.add(marketId)
    }
    setExpandedRows(newExpanded)
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
        [marketId]: currentSources.filter((id) => id !== sourceId),
      })
    }
  }

  const handlePredict = async (market: Market) => {
    const selectedModel = selectedModels[market.id]
    // Note: Credit validation is now handled in the AdvancedPredictionPanel component

    // Open modal and start thinking state
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
          model: selectedModel,
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
                setThinkingStates({
                  ...thinkingStates,
                  [market.id]: {
                    isThinking: true,
                    message: data.message,
                    progress: data.progress || 0,
                  },
                })
              } else if (data.type === "result") {
                setThinkingStates({
                  ...thinkingStates,
                  [market.id]: { isThinking: false, message: "", progress: 100 },
                })
                setPredictions((prev) => ({
                  ...prev,
                  [market.id]: data.prediction,
                }))
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Prediction failed:", error)
      setThinkingStates({
        ...thinkingStates,
        [market.id]: { isThinking: false, message: "", progress: 0 },
      })
    }
  }

  const closeModal = (marketId: string) => {
    setModalOpen({ ...modalOpen, [marketId]: false })
    setThinkingStates({ ...thinkingStates, [marketId]: { isThinking: false, message: "", progress: 0 } })
  }

  if (loadingMarketData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-black">Trending Markets</h2>
          <Badge variant="secondary" className="bg-[#4B9CD3]/10 text-[#4B9CD3]">
            <TrendingUp className="h-3 w-3 mr-1" />
            Top 10
          </Badge>
        </div>
        <div className="border rounded-lg">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <h2 className="text-2xl font-semibold text-black">Trending Markets</h2>
        <Badge variant="secondary" className="bg-[#4B9CD3]/10 text-[#4B9CD3]">
          <TrendingUp className="h-3 w-3 mr-1" />
          Top 10
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
          <div className="col-span-5">Market</div>
          <div className="col-span-1">Category</div>
          <div className="col-span-2">Volume</div>
          <div className="col-span-2">Current Odds</div>
          <div className="col-span-2 font-bold">Predict</div>
        </div>

        {/* Table Rows */}
        {markets.map((market, index) => (
          <div key={market.id} className="border-b last:border-b-0">
            {/* Main Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-black leading-tight">{market.question}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <Badge variant="outline" className="text-xs">
                        {market.category}
                      </Badge>
                      <span>${(market.volume / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#4B9CD3] border-[#4B9CD3] hover:bg-[#4B9CD3] hover:text-white"
                    >
                      Free
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => toggleRow(market.id)}
                      className="bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                    >
                      <span className="mr-1">Advanced</span>
                      {expandedRows.has(market.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4 text-sm">
                    {market.outcomes.slice(0, 2).map((outcome, idx) => (
                      <div key={idx} className="flex items-center space-x-1">
                        <span className="text-gray-600">{outcome.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(outcome.price * 100).toFixed(0)}¢
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:contents">
                <div className="col-span-5">
                  <h3 className="font-medium text-black leading-tight mb-1">{market.question}</h3>
                  <div className="text-xs text-gray-500">{new Date(market.endDate).toLocaleDateString()}</div>
                </div>

                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    {market.category}
                  </Badge>
                </div>

                <div className="col-span-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span>${(market.volume / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex space-x-2">
                    {market.outcomes.slice(0, 2).map((outcome, idx) => (
                      <div key={idx} className="flex items-center space-x-1">
                        <span className="text-sm text-gray-700">{outcome.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(outcome.price * 100).toFixed(0)}¢
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[#4B9CD3] border-[#4B9CD3] hover:bg-[#4B9CD3] hover:text-white"
                    >
                      Free
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => toggleRow(market.id)}
                      className="flex-1 bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                    >
                      <span className="mr-1">Advanced</span>
                      {expandedRows.has(market.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Panel */}
            {expandedRows.has(market.id) && (
              <AdvancedPredictionPanel
                market={market}
                selectedModel={selectedModels[market.id]}
                onModelChange={(modelId) => setSelectedModels({ ...selectedModels, [market.id]: modelId })}
                selectedDataSources={selectedDataSources[market.id] || []}
                onDataSourceChange={(sourceId, checked) => handleDataSourceChange(market.id, sourceId, checked)}
                onPredict={() => handlePredict(market)}
                isLoading={loadingPredictions.has(market.id)}
                prediction={predictions[market.id] || null}
              />
            )}
          </div>
        ))}
        {/* Prediction Modals */}
        {markets.map((market) => (
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
    </div>
  )
}

// Mock data for demo purposes
const mockMarkets: Market[] = [
  {
    id: "1",
    question: "(Mock Data) Will Bitcoin reach $100,000 by end of 2024?",
    description:
      'This market resolves to "Yes" if Bitcoin (BTC) reaches or exceeds $100,000 USD at any point before January 1, 2025, 00:00 UTC.',
    volume: 125000,
    liquidity: 45000,
    outcomes: [
      { name: "Yes", price: 0.65 },
      { name: "No", price: 0.35 },
    ],
    endDate: "2024-12-31",
    category: "Crypto",
    marketURL: "www.somemarket.com/1234",
  },
  {
    id: "2",
    question: "(Mock Data) Will the Lakers make the NBA playoffs?",
    description: "This market resolves based on whether the Los Angeles Lakers qualify for the 2024 NBA playoffs.",
    volume: 89000,
    liquidity: 32000,
    outcomes: [
      { name: "Yes", price: 0.72 },
      { name: "No", price: 0.28 },
    ],
    endDate: "2024-04-15",
    category: "Sports",
    marketURL: "www.somemarket.com/1234",
  },
  {
    id: "3",
    question: "(Mock Data) Will AI achieve AGI by 2025?",
    description:
      "This market resolves to 'Yes' if a consensus of AI researchers agrees that Artificial General Intelligence has been achieved by December 31, 2025.",
    volume: 156000,
    liquidity: 67000,
    outcomes: [
      { name: "Yes", price: 0.23 },
      { name: "No", price: 0.77 },
    ],
    endDate: "2025-12-31",
    category: "Technology",
    marketURL: "www.somemarket.com/1234",
  },
  {
    id: "4",
    question: "(Mock Data) Will Tesla stock hit $300 this year?",
    description:
      "This market resolves to 'Yes' if Tesla (TSLA) stock price reaches or exceeds $300 per share at any point during 2024.",
    volume: 98000,
    liquidity: 41000,
    outcomes: [
      { name: "Yes", price: 0.45 },
      { name: "No", price: 0.55 },
    ],
    endDate: "2024-12-31",
    category: "Stocks",
    marketURL: "www.somemarket.com/1234",
  },
  {
    id: "5",
    question: "(Mock Data) Will there be a recession in 2024?",
    description:
      "This market resolves to 'Yes' if the US economy enters a recession (defined as two consecutive quarters of negative GDP growth) during 2024.",
    volume: 234000,
    liquidity: 89000,
    outcomes: [
      { name: "Yes", price: 0.38 },
      { name: "No", price: 0.62 },
    ],
    endDate: "2024-12-31",
    category: "Economics",
    marketURL: "www.somemarket.com/1234",
  },
  {
    id: "6",
    question: "(Mock Data) Will SpaceX land on Mars by 2026?",
    description:
      "This market resolves to 'Yes' if SpaceX successfully lands a spacecraft on Mars by December 31, 2026.",
    volume: 167000,
    liquidity: 54000,
    outcomes: [
      { name: "Yes", price: 0.31 },
      { name: "No", price: 0.69 },
    ],
    endDate: "2026-12-31",
    category: "Space",
    marketURL: "www.somemarket.com/1234",
  },
]
