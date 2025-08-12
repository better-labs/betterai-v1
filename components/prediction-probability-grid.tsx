import React from 'react'
import { cn, formatPercent, toUnitProbability } from '@/lib/utils'

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

  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-3', className)}>
      {/* Market Probability */}
      <div className="sm:col-span-1">
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

      {/* AI Probability */}
      <div className="sm:col-span-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Probability</div>
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

      {/* Difference */}
      <div className="sm:col-span-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Difference</div>
        <div className="mt-1 text-xl text-right">{difference0 == null ? '—' : formatPercent(difference0)}</div>
      </div>
    </div>
  )
}


