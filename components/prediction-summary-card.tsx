import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PredictionProbabilityGrid } from '@/components/prediction-probability-grid'
import { cn, formatPercent, toUnitProbability } from '@/lib/utils'
import { PredictionMeta } from '@/components/prediction-meta'

interface PredictionSummaryCardProps {
  marketOutcomes?: Array<string | null | undefined> | null
  marketOutcomePrices?: Array<unknown> | null
  aiOutcomes?: Array<string | null | undefined> | null
  aiOutcomesProbabilities?: Array<unknown> | null
  confidenceLevel?: 'High' | 'Medium' | 'Low' | null
  modelName?: string | null
  createdAt?: Date | string | null
  className?: string
}

export function PredictionSummaryCard({
  marketOutcomes,
  marketOutcomePrices,
  aiOutcomes,
  aiOutcomesProbabilities,
  confidenceLevel,
  modelName,
  createdAt,
  className,
}: PredictionSummaryCardProps) {
  const mp0 = toUnitProbability(marketOutcomePrices?.[0])
  const ap0 = toUnitProbability(aiOutcomesProbabilities?.[0])
  const delta = mp0 != null && ap0 != null ? Math.abs(mp0 - ap0) : null

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Prediction Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PredictionProbabilityGrid
          marketOutcomes={marketOutcomes}
          marketOutcomePrices={marketOutcomePrices}
          aiOutcomes={aiOutcomes}
          aiOutcomesProbabilities={aiOutcomesProbabilities}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">AI Probability</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(ap0)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market Probability</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(mp0)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Delta</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(delta)}</div>
          </div>
          <div className="flex items-end justify-start sm:justify-end">
            <PredictionMeta
              confidenceLevel={confidenceLevel ?? null}
              modelName={modelName ?? null}
              createdAt={createdAt ?? null}
              align="right"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


