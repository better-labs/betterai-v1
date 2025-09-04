'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Calendar, DollarSign, BarChart2, ExternalLink } from 'lucide-react'
import { formatVolume } from '@/lib/utils'
import { typography, components } from '@/lib/design-system'
import type { EventDTO, MarketDTO } from '@/lib/types'
import { StatsDisplaySection } from '@/shared/ui/stats-display-section.client'
import { MarketHeader } from "./market-card-sections"

interface MarketOverviewCardProps {
  market: MarketDTO
  externalMarketUrl?: string | null 
  event?: EventDTO | null
}

export function MarketOverviewCard({ market, externalMarketUrl, event}: MarketOverviewCardProps) {
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
              <div className={`${typography.bodySmall} whitespace-pre-wrap`}>
                {market.description}
              </div>
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
                  <div className={components.marketMetrics.metricLabel}>Closes</div>
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
        {/* External Market Link */}
        {externalMarketUrl && (
          <div className={components.cardFooter.container}>
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
          </div>
        )}
      </CardFooter>
      
    </Card>
  )
}