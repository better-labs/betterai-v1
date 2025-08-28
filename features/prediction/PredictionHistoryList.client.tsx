"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatPercent } from '@/lib/utils'
import { computeDeltaFromArrays, DELTA_TOOLTIP, getDeltaColor } from '@/lib/delta'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { layout, components, spacing, typography } from '@/lib/design-system'
import type { PredictionCheckDTO, PredictionDTO } from '@/lib/types'

type CheckItem = Pick<PredictionCheckDTO, 'createdAt' | 'aiProbability' | 'marketProbability' | 'delta' | 'marketClosed'>

type PredictionItem = Pick<PredictionDTO, 'id' | 'createdAt' | 'modelName' | 'outcomesProbabilities'> & {
  marketOutcomePrices?: Array<unknown> | null
}

interface PredictionHistoryListProps {
  checks?: CheckItem[] | null
  predictions?: PredictionItem[] | null
  className?: string
  marketId?: string | null
  showChecks?: boolean
  showPredictions?: boolean
  currentMarketOutcomePrices?: Array<unknown> | null
}

export function PredictionHistoryList({ checks, predictions, className, marketId, showChecks = true, showPredictions = true, currentMarketOutcomePrices }: PredictionHistoryListProps) {
  const router = useRouter()
  const hasChecks = !!checks && checks.length > 0
  const hasPredictions = !!predictions && predictions.length > 0
  const renderChecks = showChecks && hasChecks
  const renderPredictions = showPredictions && hasPredictions
  if (!renderChecks && !renderPredictions) return null

  const handlePredictionClick = (predictionId: string) => {
    router.push(`/prediction/${predictionId}`)
  }


  return (
    <div className={className}>
      

      {renderPredictions && (
        <Card>
          <CardHeader>
            <CardTitle>Past Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions!.map((p, idx) => {
                const delta = computeDeltaFromArrays(
                  currentMarketOutcomePrices,
                  Array.isArray(p.outcomesProbabilities) ? (p.outcomesProbabilities as unknown[]) : null
                )
                
                const isClickable = !!p.id
                
                return (
                  <div
                    key={idx}
                    onClick={() => isClickable && handlePredictionClick(p.id!)}
                    className={`flex items-center justify-between p-3 rounded-md border border-border ${isClickable ? 'hover:bg-muted/40 cursor-pointer' : ''}`}
                    role={isClickable ? "button" : undefined}
                    data-debug-id={isClickable ? "prediction-row" : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`${typography.body} text-muted-foreground`}>Delta:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`${typography.bodyLarge} tabular-nums ${getDeltaColor(delta)}`}>
                              {delta !== null ? formatPercent(delta) : '—'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{DELTA_TOOLTIP}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className={`${typography.bodySmall} text-muted-foreground`}>
                        {new Date(p.createdAt).toLocaleString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className={`${typography.caption} mt-1`}>
                        {p.modelName || 'Unknown Model'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          {marketId && (
            <CardFooter>
              <Link href={`/market/${marketId}/predictions`} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                View all predictions
              </Link>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}


