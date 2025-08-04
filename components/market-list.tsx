"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, DollarSign, Calendar, BarChart2 } from "lucide-react"
import { MarketDetailPanel } from "@/components/market-detail-panel"
import { Market, PredictionResult } from "@/lib/types"
import { formatVolume } from "@/lib/utils"

interface MarketListProps {
  markets: Market[]
  expandedMarkets: Set<string>
  onToggleMarket: (marketId: string) => void
  selectedModels: Record<string, string[]>
  onModelChange: (marketId: string, modelId: string, checked: boolean) => void
  selectedDataSources: Record<string, string[]>
  onDataSourceChange: (marketId: string, sourceId: string, checked: boolean) => void
  onPredict: (market: Market) => void
  loadingPredictions: Set<string>
  predictions: Record<string, PredictionResult>
}

export function MarketList({
  markets,
  expandedMarkets,
  onToggleMarket,
  selectedModels,
  onModelChange,
  selectedDataSources,
  onDataSourceChange,
  onPredict,
  loadingPredictions,
  predictions,
}: MarketListProps) {
  const [marketPredictions, setMarketPredictions] = useState<Record<string, PredictionResult>>({})
  const [loadingMarketPredictions, setLoadingMarketPredictions] = useState<Set<string>>(new Set())
  const processedMarkets = useRef<Set<string>>(new Set())

  const fetchMarketPrediction = useCallback(async (marketId: string) => {
    if (loadingMarketPredictions.has(marketId) || marketPredictions[marketId]) {
      return
    }

    setLoadingMarketPredictions(prev => new Set(prev).add(marketId))
    
    try {
      const response = await fetch(`/api/markets/${marketId}/prediction`)
      if (response.ok) {
        const data = await response.json()
        if (data.prediction) {
          setMarketPredictions(prev => ({
            ...prev,
            [marketId]: data.prediction
          }))
        }
      }
    } catch (error) {
      console.error(`Failed to fetch market prediction for ${marketId}:`, error)
    } finally {
      setLoadingMarketPredictions(prev => {
        const newSet = new Set(prev)
        newSet.delete(marketId)
        return newSet
      })
    }
  }, [loadingMarketPredictions, marketPredictions])

  // Fetch market predictions for markets that don't have AI predictions
  useEffect(() => {
    markets.forEach(market => {
      if (!predictions[market.id] && !marketPredictions[market.id] && !loadingMarketPredictions.has(market.id) && !processedMarkets.current.has(market.id)) {
        processedMarkets.current.add(market.id)
        fetchMarketPrediction(market.id)
      }
    })
  }, [markets, predictions])

  return (
    <div className="pl-4 pr-4 pb-4 bg-muted/20 md:pl-8" data-testid="market-list">
      {markets.map(market => (
        <div key={market.id} className="border-t" data-testid={`market-row-${market.id}`}>
          {/* Market Row */}
          <div className="p-4 space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4" data-testid={`market-content-${market.id}`}>
            {/* Market Question - Full width on mobile, 4 cols on desktop */}
            <div className="md:col-span-4">
              <h4 className="font-medium text-foreground text-sm md:text-base">
                <a 
                  href={`/market/${market.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {market.question}
                </a>
              </h4>
              <div className="flex flex-col space-y-2 mt-2 md:flex-row md:items-center md:space-x-4 md:space-y-0 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span>{formatVolume(Number(market.volume) || 0)} Vol</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Ends: July 31, 2025</span>
                </div>
              </div>
            </div>

            {/* Prediction Sections - Stack vertically on mobile, grid on desktop */}
            <div className="space-y-3 md:space-y-0 md:col-span-8 md:grid md:grid-cols-3 md:gap-4">
              {/* Market Prediction Section */}
              <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-medium text-muted-foreground mb-3 md:mb-4">Market Prediction</div>
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {market.outcomePrices?.[0] ? `${(Number(market.outcomePrices[0]) * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <span className="text-xs text-muted-foreground">Chance</span>
                    <div className="w-10 md:w-12 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 rounded-full bg-primary"
                        style={{ 
                          width: market.outcomePrices?.[0] 
                            ? `${Math.min(100, Number(market.outcomePrices[0]) * 100)}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Prediction (Basic) Section */}
              <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-medium text-muted-foreground mb-3 md:mb-4">AI Prediction (Basic)</div>
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {(() => {
                      // First check if there's a current AI prediction
                      if (predictions[market.id]) {
                        const prediction = predictions[market.id]
                        return `${(prediction.probability * 100).toFixed(0)}%`
                      }
                      
                      
                      // Show loading state
                      if (loadingMarketPredictions.has(market.id)) {
                        return '...'
                      }
                      
                      
                      // Default fallback
                      return '--'
                    })()}
                  </div>
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <span className="text-xs text-muted-foreground">Chance</span>
                    <div className="w-10 md:w-12 h-2 bg-muted rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          (() => {
                            // First check if there's a current AI prediction
                            if (predictions[market.id]) {
                              const prediction = predictions[market.id]
                              return `w-${Math.min(12, Math.max(1, Math.round(prediction.probability * 12)))} bg-green-500`
                            }
                            
                            // Then check if there's a stored market prediction
                            if (marketPredictions[market.id]) {
                              const prediction = marketPredictions[market.id]
                              return `w-${Math.min(12, Math.max(1, Math.round(prediction.probability * 12)))} bg-green-500`
                            }
                            
                            // Show loading state
                            if (loadingMarketPredictions.has(market.id)) {
                              return 'w-6 bg-muted-foreground animate-pulse'
                            }
                            
                            
                            // Default fallback
                            return 'w-6 bg-green-500'
                          })()
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Prediction (Premium) Section */}
              <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onToggleMarket(market.id)}
                data-testid={`market-expand-${market.id}`}
              >
                <div className="text-sm font-medium text-muted-foreground mb-3 md:mb-4">AI Prediction (Premium)</div>
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  {expandedMarkets.has(market.id) ? (
                    <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  ) : (
                    <>
                      <div className="text-2xl md:text-3xl font-bold text-primary">
                        {(() => {
                          
                          // Show "--" when no prediction is available
                          return '--'
                        })()}
                      </div>
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Prediction Panel for each market */}
          {expandedMarkets.has(market.id) && (
            <div className="p-4 bg-muted/30" data-testid={`market-panel-${market.id}`}>
              <MarketDetailPanel
                market={market}
                selectedModels={selectedModels[market.id] || []}
                onModelChange={(modelId, checked) => onModelChange(market.id, modelId, checked)}
                selectedDataSources={selectedDataSources[market.id] || []}
                onDataSourceChange={(sourceId, checked) =>
                  onDataSourceChange(market.id, sourceId, checked)
                }
                onPredict={() => onPredict(market)}
                isLoading={loadingPredictions.has(market.id)}
                prediction={predictions[market.id] || null}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 