import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PredictionProbabilityGrid } from '@/components/prediction-probability-grid'
import { cn, formatPercent, toUnitProbability } from '@/lib/utils'
import { PredictionMeta } from '@/components/prediction-meta'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

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

  // Color coding based on delta magnitude
  const getDeltaColor = (delta: number | null) => {
    if (delta == null) return 'text-muted-foreground'
    if (delta >= 0.20) return 'text-green-600' // High disagreement - major AI insight!
    if (delta >= 0.10) return 'text-yellow-600' // Small disagreement
    return 'text-foreground' // Close agreement - no color
  }

  const getDeltaBg = (delta: number | null) => {
    if (delta == null) return 'bg-muted/20 border-border'
    if (delta >= 0.20) return 'bg-green-50 border-green-200' // High disagreement - major AI insight!
    if (delta >= 0.10) return 'bg-yellow-50 border-yellow-200' // Small disagreement
    return 'bg-background border-border' // Close agreement - no color
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Prediction Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* <PredictionProbabilityGrid
          marketOutcomes={marketOutcomes}
          marketOutcomePrices={marketOutcomePrices}
          aiOutcomes={aiOutcomes}
          aiOutcomesProbabilities={aiOutcomesProbabilities}
        /> */}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market Probability</div>
            <div className="mt-1 text-5xl font-semibold tabular-nums leading-none">{formatPercent(mp0)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">AI Prediction</div>
            <div className="mt-1 text-5xl font-semibold tabular-nums leading-none">{formatPercent(ap0)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Delta</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64">
                    <p className="text-xs">
                      Delta is the difference between the Market Probability and AI Prediction
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={`rounded-lg border px-4 py-3 text-center shadow-sm ${getDeltaBg(delta)}`}>
              <div className={`text-4xl font-bold tabular-nums leading-none ${getDeltaColor(delta)}`}>
                {formatPercent(delta)}
              </div>
            </div>
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


