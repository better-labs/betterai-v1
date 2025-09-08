'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { DollarSign, BarChart2, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/use-toast'
import { formatVolume } from '@/lib/utils'
import { typography, components } from '@/lib/design-system'
import type { EventDTO, MarketDTO } from '@/lib/types'
import { StatsDisplaySection } from '@/shared/ui/stats-display-section.client'
import { TextCollapse } from '@/shared/ui/text-collapse.client'
import { MarketHeader } from "./market-card-sections"
import { trpc } from '@/lib/trpc/client'

interface MarketOverviewCardProps {
  market: MarketDTO
  externalMarketUrl?: string | null 
  event?: EventDTO | null
}

export function MarketOverviewCard({ market, externalMarketUrl, event}: MarketOverviewCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const utils = trpc.useUtils()

  const refreshMarketMutation = trpc.markets.refresh.useMutation({
    onSuccess: () => {
      utils.markets.getById.invalidate({ id: market.id })
      toast({
        title: "Market Updated",
        description: "Market data has been refreshed from Polymarket",
      })
      setIsRefreshing(false)
      window.location.reload()
    },
    onError: (error) => {
      console.error('Error refreshing market:', error)
      toast({
        title: "Update Failed",
        description: "Failed to refresh market data. Please try again.",
        variant: "destructive",
      })
      setIsRefreshing(false)
    }
  })

  const handleRefreshMarket = () => {
    setIsRefreshing(true)
    refreshMarketMutation.mutate({ marketId: market.id })
  }

  return (
    <Card>
      <CardHeader>
        <MarketHeader market={market} event={event} showActiveStatus={true} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          

          

        
          {/* Market Outcomes & Prices */}
          {market.outcomePrices && market.outcomePrices.length > 0 && market.outcomes && (
            <StatsDisplaySection
              title="Market Probability"
              stats={market.outcomes.map((outcome, index) => ({
                label: outcome,
                value: market.outcomePrices[index] || null
              }))}
            />
          )}

          {/* Market Description */}
          {market.description && (
            <div>
              <h4 className={components.statsDisplay.sectionTitle}>Description</h4>
              <TextCollapse maxLength={150}>
                {market.description}
              </TextCollapse>
            </div>
          )}


          {/* Market Metrics */}
          <div className={components.marketMetrics.grid}>
            <div className={components.marketMetrics.metric}>
              <DollarSign className={components.marketMetrics.icon} />
              <div className={components.marketMetrics.metricContent}>
                <div className={components.marketMetrics.metricLabel}>Volume</div>
                <div className={components.marketMetrics.metricValue}>
                  {formatVolume(Number(market.volume) || 0)}
                </div>
              </div>
            </div>

            <div className={components.marketMetrics.metric}>
              <BarChart2 className={components.marketMetrics.icon} />
              <div className={components.marketMetrics.metricContent}>
                <div className={components.marketMetrics.metricLabel}>Liquidity</div>
                <div className={components.marketMetrics.metricValue}>
                  {formatVolume(Number(market.liquidity) || 0)}
                </div>
              </div>
            </div>

          </div>

        </div>
      </CardContent>
      
      <CardFooter>
        {/* Horizontal Action Bar with Workflow Logic: Update → View */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Update Market Data Button - Primary workflow action */}
          <Button
            onClick={handleRefreshMarket}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            data-debug-id="refresh-market-btn"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Update Data'}
          </Button>
          
          {/* External Market Link - Secondary workflow action */}
          {externalMarketUrl && (
            <a
              href={externalMarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View on Polymarket
            </a>
          )}
        </div>
      </CardFooter>
      
    </Card>
  )
}