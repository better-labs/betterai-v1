"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, Brain, Zap, Database, TrendingUp, DollarSign, Users } from "lucide-react"
import { PredictionModal } from "@/components/prediction-modal"

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
  const [loading, setLoading] = useState(true)
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
      const marketData = data.markets || mockMarkets
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
      setLoading(false)
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

  const aiModels = [
    { id: "gpt-4o", name: "GPT-4o", cost: 5, quality: "Premium", description: "Latest OpenAI model" },
    { id: "claude-3", name: "Claude 3", cost: 4, quality: "Premium", description: "Anthropic's advanced model" },
    { id: "gpt-3.5", name: "GPT-3.5", cost: 0, quality: "Free", description: "Free tier model" },
  ]

  const dataSources = [
    { id: "news", name: "News Articles", description: "Latest financial and crypto news" },
    { id: "twitter", name: "Twitter/X", description: "Social sentiment analysis" },
    { id: "onchain", name: "On-chain Data", description: "Blockchain metrics and analytics" },
    { id: "technical", name: "Technical Analysis", description: "Price charts and indicators" },
  ]

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
    const selectedModelData = aiModels.find((m) => m.id === selectedModel)

    if (selectedModelData && selectedModelData.cost > credits) {
      alert("Insufficient credits. Please top up your account.")
      return
    }

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

                // Deduct credits
                if (selectedModelData && selectedModelData.cost > 0) {
                  setCredits((prev) => prev - selectedModelData.cost)
                }
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

  if (loading) {
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
          <div className="col-span-2">Volume/Liquidity</div>
          <div className="col-span-3">Current Odds</div>
          <div className="col-span-1">Action</div>
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
                      <span>${(market.volume / 1000).toFixed(0)}K vol</span>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => toggleRow(market.id)}
                    className="ml-2 bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                  >
                    <span className="mr-1">Predict</span>
                    {expandedRows.has(market.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
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
                  <div className="flex items-center space-x-1 mb-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span>${(market.volume / 1000).toFixed(0)}K vol</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">${(market.liquidity / 1000).toFixed(0)}K liq</span>
                  </div>
                </div>

                <div className="col-span-3">
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

                <div className="col-span-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => toggleRow(market.id)}
                    className="w-full bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                  >
                    <span className="mr-1">Predict</span>
                    {expandedRows.has(market.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded Panel */}
            {expandedRows.has(market.id) && (
              <div className="border-t bg-gray-50/50 p-6">
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h4 className="font-semibold text-black mb-2">Market Description</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{market.description}</p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-[#4B9CD3]" />
                        <span>BetterAI Prediction Coach</span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3 text-black">Choose AI Model</h3>
                        <RadioGroup
                          value={selectedModels[market.id]}
                          onValueChange={(value) => setSelectedModels({ ...selectedModels, [market.id]: value })}
                        >
                          {aiModels.map((model) => (
                            <div key={model.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                              <RadioGroupItem value={model.id} id={`${market.id}-${model.id}`} />
                              <Label htmlFor={`${market.id}-${model.id}`} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-sm text-gray-500">{model.description}</div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={model.cost === 0 ? "secondary" : "default"}>
                                      {model.cost === 0 ? "Free" : `${model.cost} credits`}
                                    </Badge>
                                    <div className="text-xs text-gray-500 mt-1">{model.quality}</div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-3 text-black">Enrich with Data Sources</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dataSources.map((source) => (
                            <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={`${market.id}-${source.id}`}
                                checked={(selectedDataSources[market.id] || []).includes(source.id)}
                                onCheckedChange={(checked) =>
                                  handleDataSourceChange(market.id, source.id, checked as boolean)
                                }
                              />
                              <Label htmlFor={`${market.id}-${source.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium">{source.name}</div>
                                <div className="text-sm text-gray-500">{source.description}</div>
                              </Label>
                              <Database className="h-4 w-4 text-[#4B9CD3]" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handlePredict(market)}
                        disabled={loadingPredictions.has(market.id)}
                        className="w-full bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                      >
                        {loadingPredictions.has(market.id) ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Generating Prediction...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Get AI Prediction
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Prediction Results */}
                  {predictions[market.id] && (
                    <Card className="border-[#4B9CD3] mt-6">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-[#4B9CD3]">
                          <Brain className="h-5 w-5" />
                          <span>AI Prediction Result</span>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#4B9CD3]">
                              {predictions[market.id].confidence}%
                            </div>
                            <div className="text-sm text-gray-500">Confidence</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-black">
                              {predictions[market.id].recommendedOutcome}
                            </div>
                            <div className="text-sm text-gray-500">Recommended</div>
                          </div>
                          <div className="text-center">
                            <Badge
                              variant={
                                predictions[market.id].riskLevel === "Low"
                                  ? "secondary"
                                  : predictions[market.id].riskLevel === "Medium"
                                    ? "default"
                                    : "destructive"
                              }
                            >
                              {predictions[market.id].riskLevel} Risk
                            </Badge>
                            <div className="text-sm text-gray-500 mt-1">Risk Level</div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold mb-2 text-black">Analysis</h4>
                          <p className="text-gray-700 leading-relaxed">{predictions[market.id].prediction}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2 text-black">Reasoning</h4>
                          <p className="text-gray-700 leading-relaxed">{predictions[market.id].reasoning}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
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
    question: "Will Bitcoin reach $100,000 by end of 2024?",
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
  },
  {
    id: "2",
    question: "Will the Lakers make the NBA playoffs?",
    description: "This market resolves based on whether the Los Angeles Lakers qualify for the 2024 NBA playoffs.",
    volume: 89000,
    liquidity: 32000,
    outcomes: [
      { name: "Yes", price: 0.72 },
      { name: "No", price: 0.28 },
    ],
    endDate: "2024-04-15",
    category: "Sports",
  },
  {
    id: "3",
    question: "Will AI achieve AGI by 2025?",
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
  },
  {
    id: "4",
    question: "Will Tesla stock hit $300 this year?",
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
  },
  {
    id: "5",
    question: "Will there be a recession in 2024?",
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
  },
  {
    id: "6",
    question: "Will SpaceX land on Mars by 2026?",
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
  },
]
