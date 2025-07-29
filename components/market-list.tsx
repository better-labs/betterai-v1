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
            <div className="col-span-4">
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

            {/* Market Prediction Section */}
            <div className="col-span-2">
              <div className="border border-muted-foreground/20 rounded-lg p-3 bg-background shadow-sm">
                <div className="text-xs font-medium text-muted-foreground mb-3">Market Prediction</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold text-foreground">
                    {market.question.toLowerCase().includes('libertarian') ? '12%' : 
                     market.question.toLowerCase().includes('democratic') ? '73%' : '58%'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground leading-tight">Chance</span>
                    <div className="w-8 h-1 bg-muted rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          market.question.toLowerCase().includes('libertarian') ? 'w-1 bg-primary' :
                          market.question.toLowerCase().includes('democratic') ? 'w-6 bg-primary' : 'w-5 bg-primary'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prediction (Basic) Section */}
            <div className="col-span-2">
              <div className="border border-muted-foreground/20 rounded-lg p-3 bg-background shadow-sm">
                <div className="text-xs font-medium text-muted-foreground mb-3">AI Prediction (Basic)</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold text-foreground">
                    {market.question.toLowerCase().includes('libertarian') ? '8%' : 
                     market.question.toLowerCase().includes('democratic') ? '68%' : '52%'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground leading-tight">Chance</span>
                    <div className="w-8 h-1 bg-muted rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          market.question.toLowerCase().includes('libertarian') ? 'w-1 bg-green-500' :
                          market.question.toLowerCase().includes('democratic') ? 'w-5 bg-green-500' : 'w-4 bg-green-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 flex items-center justify-end">
              <div 
                className="border border-muted-foreground/20 rounded-lg p-3 bg-background shadow-sm w-full cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onToggleMarket(market.id)}
                data-testid={`market-expand-${market.id}`}
              >
                <div className="text-xs font-bold text-white mb-3">AI Prediction (Pro)</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold text-primary">Go</div>
                  <div className="flex flex-col items-center">
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
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