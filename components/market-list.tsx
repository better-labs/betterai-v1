"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, DollarSign, Calendar, BarChart2 } from "lucide-react"
import { MarketDetailPanel } from "@/components/market-detail-panel"
import { Market, PredictionResult } from "@/lib/types"

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
                  href={market.marketURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {market.question}
                </a>
              </h4>
              <div className="flex flex-col space-y-2 mt-2 md:flex-row md:items-center md:space-x-4 md:space-y-0 text-xs text-muted-foreground">
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

            {/* Prediction Sections - Stack vertically on mobile, grid on desktop */}
            <div className="space-y-3 md:space-y-0 md:col-span-8 md:grid md:grid-cols-3 md:gap-4">
              {/* Market Prediction Section */}
              <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-medium text-muted-foreground mb-3 md:mb-4">Market Prediction</div>
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    {market.question.toLowerCase().includes('libertarian') ? '12%' : 
                     market.question.toLowerCase().includes('democratic') ? '73%' : '58%'}
                  </div>
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <span className="text-xs text-muted-foreground">Chance</span>
                    <div className="w-10 md:w-12 h-2 bg-muted rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          market.question.toLowerCase().includes('libertarian') ? 'w-1 bg-primary' :
                          market.question.toLowerCase().includes('democratic') ? 'w-9 bg-primary' : 'w-7 bg-primary'
                        }`}
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
                    {market.question.toLowerCase().includes('libertarian') ? '8%' : 
                     market.question.toLowerCase().includes('democratic') ? '68%' : '52%'}
                  </div>
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <span className="text-xs text-muted-foreground">Chance</span>
                    <div className="w-10 md:w-12 h-2 bg-muted rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          market.question.toLowerCase().includes('libertarian') ? 'w-1 bg-green-500' :
                          market.question.toLowerCase().includes('democratic') ? 'w-8 bg-green-500' : 'w-6 bg-green-500'
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
                      <div className="text-2xl md:text-3xl font-bold text-primary">Go</div>
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