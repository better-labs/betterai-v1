import React from 'react'
import { cn, formatPercent, toUnitProbability } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface PredictionProbabilityGridProps {
  marketOutcomes?: Array<string | null | undefined> | null
  marketOutcomePrices?: Array<unknown> | null
  aiOutcomes?: Array<string | null | undefined> | null
  aiOutcomesProbabilities?: Array<unknown> | null
  className?: string
}

export function PredictionProbabilityGrid({
  marketOutcomes,
  marketOutcomePrices,
  aiOutcomes,
  aiOutcomesProbabilities,
  className,
}: PredictionProbabilityGridProps) {
  const mo0 = marketOutcomes?.[0] ?? 'Outcome 1'
  const mo1 = marketOutcomes?.[1] ?? 'Outcome 2'
  const mp0 = marketOutcomePrices?.[0]
  const mp1 = marketOutcomePrices?.[1]

  const ao0 = aiOutcomes?.[0] ?? ''
  const ao1 = aiOutcomes?.[1] ?? ''
  const ap0 = aiOutcomesProbabilities?.[0]
  const ap1 = aiOutcomesProbabilities?.[1]

  // Absolute difference for first outcome
  const difference0 = (() => {
    const marketP0 = toUnitProbability(mp0)
    const aiP0 = toUnitProbability(ap0)
    if (marketP0 == null || aiP0 == null) return null
    return Math.abs(marketP0 - aiP0)
  })()

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
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-5', className)}>
      {/* Market Probability */}
      <div className="sm:col-span-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Market Probability</div>
        <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
          <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
            <div className="text-muted-foreground">{mo0}</div>
            <div className="text-right font-semibold tabular-nums">{formatPercent(mp0)}</div>
          </div>
          <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
            <div className="text-muted-foreground">{mo1}</div>
            <div className="text-right font-semibold tabular-nums">{formatPercent(mp1)}</div>
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="sm:col-span-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Prediction</div>
        <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
          <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
            <div className="text-muted-foreground">{ao0}</div>
            <div className="text-right font-semibold tabular-nums">{formatPercent(ap0)}</div>
          </div>
          <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
            <div className="text-muted-foreground">{ao1}</div>
            <div className="text-right font-semibold tabular-nums">{formatPercent(ap1)}</div>
          </div>
        </div>
      </div>

      {/* Delta */}
      <div className="sm:col-span-1">
        <div className="flex items-center justify-end gap-1">
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
        <div className={`mt-1 rounded-md border px-3 py-2 text-center font-bold text-lg shadow-sm ${getDeltaBg(difference0)}`}>
          <div className={getDeltaColor(difference0)}>
            {difference0 == null ? '—' : formatPercent(difference0)}
          </div>
        </div>
      </div>
    </div>
  )
}


