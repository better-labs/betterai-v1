import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Stat, StatGroup } from "@/shared/ui/stat"
import { PredictionMeta } from "@/features/prediction/PredictionMeta"
import { cn, formatPercent, toUnitProbability } from "@/lib/utils"

interface PredictionSummaryCardProps {
  marketOutcomes?: string[] | null
  marketOutcomePrices: number[] | null
  aiOutcomes?: string[] | null
  aiOutcomesProbabilities: number[] | null
  confidenceLevel: "High" | "Medium" | "Low" | null
  modelName: string | null
  createdAt: string
  className?: string
}

export function PredictionSummaryCard(props: PredictionSummaryCardProps) {
  const { marketOutcomePrices, aiOutcomesProbabilities, confidenceLevel, modelName, createdAt, className } = props
  const mp0 = toUnitProbability(marketOutcomePrices?.[0])
  const mp1 = toUnitProbability(marketOutcomePrices?.[1])
  const ap0 = toUnitProbability(aiOutcomesProbabilities?.[0])
  const ap1 = toUnitProbability(aiOutcomesProbabilities?.[1])
  const delta = mp0 != null && ap0 != null ? Math.abs(mp0 - ap0) : null

  const tone: "neutral" | "positive" | "caution" =
    delta == null ? "neutral" : delta >= 0.10 ? "positive" : delta >= 0.05 ? "caution" : "neutral"

  // No conversion needed - confidence level is already a string enum

  return (
    <Card className={cn(className)}>
      <CardHeader><CardTitle>Prediction Summary</CardTitle></CardHeader>

      <CardContent className="space-y-4">
        <StatGroup>
          <Stat
            label="Market Probability"
            value={formatPercent(mp0)}
            align="left"
          />
          <Stat
            label="AI Prediction"
            value={formatPercent(ap0)}
            align="left"
          />
          <Stat
            label="Delta"
            value={formatPercent(delta)}
            tone={tone}
            tooltip="Difference between Market Probability and AI Prediction."
            align="left"
          />
          <div className="flex items-end justify-start md:justify-end">
            <PredictionMeta
              confidenceLevel={confidenceLevel}
              modelName={modelName ?? null}
              createdAt={createdAt ?? null}
              align="right"
            />
          </div>
        </StatGroup>
      </CardContent>
    </Card>
  )
}
