import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Stat, StatGroup } from "@/shared/ui/stat"
import { PredictionMeta } from "@/features/prediction/PredictionMeta"
import { Button } from "@/shared/ui/button"
import { cn, formatPercent, toUnitProbability } from "@/lib/utils"
import { getDeltaTone } from "@/lib/delta"
import { components } from "@/lib/design-system"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

interface PredictionSummaryCardProps {
  marketOutcomes?: string[] | null
  marketOutcomePrices: number[] | null
  aiOutcomes?: string[] | null
  aiOutcomesProbabilities: number[] | null
  confidenceLevel: "High" | "Medium" | "Low" | null
  modelName: string | null
  createdAt: string
  marketId?: string | null
  className?: string
}

export function PredictionSummaryCard(props: PredictionSummaryCardProps) {
  const { marketOutcomePrices, aiOutcomesProbabilities, confidenceLevel, modelName, createdAt, marketId, className } = props
  const mp0 = toUnitProbability(marketOutcomePrices?.[0])
  const mp1 = toUnitProbability(marketOutcomePrices?.[1])
  const ap0 = toUnitProbability(aiOutcomesProbabilities?.[0])
  const ap1 = toUnitProbability(aiOutcomesProbabilities?.[1])
  const delta = mp0 != null && ap0 != null ? Math.abs(mp0 - ap0) : null

  const tone = getDeltaTone(delta)

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
        
        {/* Generate New Prediction Button */}
        {marketId && (
          <div className={components.cardFooter.container}>
            <div className={components.cardFooter.layout.single}>
              <Link href={`/prediction-builder/${marketId}`}>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  data-debug-id="generate-new-prediction-btn"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate New Prediction
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
