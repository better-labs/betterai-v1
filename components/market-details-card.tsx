import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Event, Market, Prediction } from '@/lib/types'
import { PredictionProbabilityGrid } from '@/components/prediction-probability-grid'

interface MarketDetailsCardProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  className?: string
  latestPrediction?: Prediction | null
}

export default function MarketDetailsCard({
  market,
  event,
  externalMarketUrl,
  className,
  latestPrediction,
}: MarketDetailsCardProps) {
  const lastUpdatedLabel = `Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : 'Unknown'}`

  return (
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
}


