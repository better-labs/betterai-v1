"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, DollarSign, Calendar, BarChart2 } from "lucide-react"
import { AdvancedPredictionPanel } from "@/components/advanced-prediction-panel"
import { Market, PredictionResult } from "@/lib/types"

interface MarketListProps {
  markets: Market[]
  expandedMarkets: Set<string>
  onToggleMarket: (marketId: string) => void
  selectedModels: Record<string, string>
  onModelChange: (marketId: string, modelId: string) => void
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
  return (
    <div className="pl-8 pr-4 pb-4 bg-muted/20" data-testid="market-list">
      {markets.map(market => (
        <div key={market.id} className="border-t" data-testid={`market-row-${market.id}`}>
          {/* Market Row */}
          <div className="grid grid-cols-12 gap-4 p-4" data-testid={`market-content-${market.id}`}>
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

            <div className="col-span-3 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleMarket(market.id)}
                className="flex-1"
                data-testid={`market-expand-${market.id}`}
              >
                AI Prediction (Pro)
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
            <div className="p-4 bg-muted/30" data-testid={`market-panel-${market.id}`}>
              <AdvancedPredictionPanel
                market={market}
                selectedModel={selectedModels[market.id]}
                onModelChange={modelId => onModelChange(market.id, modelId)}
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