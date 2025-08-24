"use client"

import { useEffect } from "react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ChevronDown, ChevronRight, DollarSign, Calendar, BarChart2 } from "lucide-react"
import { Market, PredictionResult } from "@/lib/types"
import { formatVolume } from "@/lib/utils"
import Link from "next/link"

interface MarketListProps {
  markets: Market[]
  predictions: Record<string, PredictionResult>
}

export function MarketList({ markets, predictions }: MarketListProps) {
  // Client component now receives all available predictions from the server (RSC).
  // No client-side fetching; simply renders.
  useEffect(() => {
    // no-op: retained to avoid accidental behavior changes; safe to remove later
  }, [markets, predictions])

  return (
    <div className="pl-4 pr-4 pb-4 bg-muted/20 md:pl-8" data-testid="market-list">
      {markets.map(market => (
        <div key={market.id} className="border-t" data-testid={`market-row-${market.id}`}>
          {/* Market Row */}
          <Link href={`/market/${market.id}`} className="block hover:bg-muted/20 hover:shadow-lg hover:shadow-muted/20 hover:-translate-y-0.5 transition-all duration-200 ease-in-out rounded-sm border-b border-border/30 hover:border-transparent">
            <div className="p-4 space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4" data-testid={`market-content-${market.id}`}>
              {/* Market Question - Full width on mobile, 4 cols on desktop */}
              <div className="md:col-span-4">
                <h4 className="font-medium text-foreground text-sm md:text-base">
                  {market.question}
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
              <div className="space-y-3 md:space-y-0 md:col-span-8 md:grid md:grid-cols-2 md:gap-4">
                {/* Market Prediction Section */}
                <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-muted-foreground mb-3 md:mb-4">Market Prediction</div>
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

                {/* AI Prediction Section */}
                <div className="border border-muted-foreground/20 rounded-lg p-3 md:p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-med font-medium text-muted-foreground mb-3 md:mb-4">AI Prediction</div>
                  <div className="flex items-center justify-center space-x-2 md:space-x-3">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">
                      {(() => {
                        // First check if there's a current AI prediction (server-provided)
                        if (predictions[market.id]) {
                          const prediction = predictions[market.id]
                          const p0 = Array.isArray((prediction as any).outcomesProbabilities) ? (prediction as any).outcomesProbabilities[0] : null
                          return p0 != null ? `${Math.round(Number(p0) * 100)}%` : '--'
                        }
                        
                        // Default fallback
                        return '--'
                      })()}
                    </div>
                    {(() => {
                      // Check if there's a current AI prediction (server-provided)
                      if (predictions[market.id]) {
                        const prediction = predictions[market.id]
                        const p0 = Array.isArray((prediction as any).outcomesProbabilities) ? (prediction as any).outcomesProbabilities[0] : null
                        return (
                          <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <span className="text-xs text-muted-foreground">Chance</span>
                            <div className="w-10 md:w-12 h-2 bg-muted rounded-full">
                              <div 
                                className={`h-2 rounded-full w-${p0 != null ? Math.min(12, Math.max(1, Math.round(Number(p0) * 12))) : 1} bg-green-500`}
                              ></div>
                            </div>
                          </div>
                        )
                      }

                      // Show "Go" when no prediction is available
                      return (
                        <div className="flex flex-col items-center space-y-1 md:space-y-2">
                          <span className="text-xs text-primary font-medium">Go</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
} 