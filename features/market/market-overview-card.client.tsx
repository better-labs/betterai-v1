'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Calendar, DollarSign, BarChart2, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/hooks/use-toast'
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

  const handleRefreshMarket = async () => {
    try {
      setIsRefreshing(true)
      
      await trpc.markets.refresh.mutate({ marketId: market.id })
      
      await utils.markets.getById.invalidate({ id: market.id })
      
      toast({
        title: "Market Updated",
        description: "Market data has been refreshed from Polymarket",
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing market:', error)
      toast({
        title: "Update Failed",
        description: "Failed to refresh market data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
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

            {market.endDate && (
              <div className={components.marketMetrics.metric}>
                <Calendar className={components.marketMetrics.icon} />
                <div className={components.marketMetrics.metricContent}>
                  <div className={components.marketMetrics.metricLabel}>Market Close Date</div>
                  <div className={components.marketMetrics.metricValue}>
                    {new Date(market.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </CardContent>
      
      <CardFooter>
        <div className={components.cardFooter.container}>
          {/* External Market Link */}
          {externalMarketUrl && (
            <div className={components.cardFooter.item}>
              <a
                href={externalMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View on Polymarket
              </a>
            </div>
          )}
          
          {/* Update Market Data Button */}
          <div className={components.cardFooter.item}>
            <Button
              onClick={handleRefreshMarket}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2"
              data-debug-id="refresh-market-btn"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Updating...' : 'Update Market Data'}
            </Button>
          </div>
        </div>
      </CardFooter>
      
    </Card>
  )
}