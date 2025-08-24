import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/shared/ui/card'
import { Badge } from '@/src/shared/ui/badge'
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from './types'
import { PredictionProbabilityGrid } from '@/src/features/prediction/PredictionProbabilityGrid'

interface MarketDetailsCardProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  className?: string
  latestPrediction?: Prediction | null
  href?: string | null
}

export default function MarketDetailsCard({
  market,
  event,
  externalMarketUrl,
  className,
  latestPrediction,
  href = null,
}: MarketDetailsCardProps) {
  const lastUpdatedLabel = `Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : 'Unknown'}`

  const card = (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Market: {market.question}
          <Badge variant={market.active ? 'default' : 'secondary'}>
            {market.active ? 'Active' : 'Closed'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Market Metadata */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">{lastUpdatedLabel}</p>
        </div>

        {/* Probability Grid */}
        <PredictionProbabilityGrid
          marketOutcomes={market.outcomes}
          marketOutcomePrices={market.outcomePrices as unknown as number[]}
          aiOutcomes={latestPrediction?.outcomes ?? null}
          aiOutcomesProbabilities={latestPrediction?.outcomesProbabilities ?? null}
          className="mt-2"
        />

        {/* External Provider Link */}
        {externalMarketUrl && (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground">
              <a
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                href={externalMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Market on {event?.marketProvider ?? 'provider'}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Make the entire card clickable when href is provided without nesting anchors
  return href ? (
    <div className="relative group">
      <div className="transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:shadow-muted/20 group-hover:-translate-y-0.5">
        {card}
      </div>
      <Link
        href={href}
        aria-label={`View market: ${market.question}`}
        className="absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
      />
    </div>
  ) : (
    card
  )
}


