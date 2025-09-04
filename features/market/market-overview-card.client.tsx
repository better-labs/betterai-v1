'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Calendar, DollarSign, BarChart2, ExternalLink } from 'lucide-react'
import { formatVolume } from '@/lib/utils'
import { typography } from '@/lib/design-system'
import type { MarketDTO } from '@/lib/types'

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
          {/* Market Question */}
          <div>
            <h3 className={`font-semibold ${typography.h4} mb-2`}>
              {market.question}
            </h3>
          </div>

          {/* Market Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Volume</div>
                <div className="text-xs text-muted-foreground">
                  {formatVolume(Number(market.volume) || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Liquidity</div>
                <div className="text-xs text-muted-foreground">
                  {formatVolume(Number(market.liquidity) || 0)}
                </div>
              </div>
            </div>

            {market.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Closes</div>
                  <div className="text-xs text-muted-foreground">
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
        </div>
      </CardContent>
      
    </Card>
  )
}