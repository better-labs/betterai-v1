'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Calendar, DollarSign, BarChart2, ExternalLink } from 'lucide-react'
import { formatVolume } from '@/lib/utils'
import { typography, components } from '@/lib/design-system'
import type { MarketDTO } from '@/lib/types'
import { StatsDisplaySection } from './stats-display-section.client'

interface MarketOverviewCardProps {
  market: MarketDTO
  externalMarketUrl?: string | null
}

export function MarketOverviewCard({ market, externalMarketUrl }: MarketOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Market Active Status */}
          {typeof market.active !== 'undefined' && market.active !== null && (
            <div className="flex justify-start">
              <span className={components.cardFooter.metadataBadge}>
                {market.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}

          {/* Market Question */}
          <div>
            <h3 className={`font-semibold ${typography.h4} mb-2`}>
              {market.question}
            </h3>
          </div>

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

          {/* External Market Link */}
          {externalMarketUrl && (
            <div className="pt-2 border-t">
              <a
                href={externalMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View on Polymarket
              </a>
            </div>
          )}

          {/* Resolution Source */}
          {market.resolutionSource && (
            <div className={components.cardFooter.container}>
              <div className={components.cardFooter.item}>
                <strong>Resolution Source:</strong> {market.resolutionSource}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
    </Card>
  )
}