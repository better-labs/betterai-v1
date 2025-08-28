"use client"

import Link from 'next/link'
import { MarketProbabilityStat } from '@/features/market/MarketProbabilityStat'
import { PredictionStats } from '@/features/prediction/PredictionStats.client'
import type { MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'

interface MarketProbabilityStatsProps {
  market: Market
  latestPrediction?: Prediction | null
  lastUpdatedLabel: string
}

export function MarketProbabilityStats({ 
  market, 
  latestPrediction, 
  lastUpdatedLabel 
}: MarketProbabilityStatsProps) {
  return (
    <div className="flex items-start gap-4">
      <div className={latestPrediction ? "flex-1" : "w-full max-w-md"}>
        <Link 
          href={`/market/${market.id}`}
          className="block hover:opacity-80 transition-opacity"
        >
          <MarketProbabilityStat 
            outcomes={market.outcomes}
            outcomePrices={market.outcomePrices as number[] | null}
            tooltip={lastUpdatedLabel}
          />
        </Link>
      </div>
        
      {/* AI Prediction Stats - only show if prediction exists */}
      {latestPrediction && (
        <PredictionStats prediction={latestPrediction} className="flex-1" />
      )}
    </div>
  )
}
