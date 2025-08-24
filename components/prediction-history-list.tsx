"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPercent, toUnitProbability } from '@/lib/utils'
import Link from 'next/link'
import { Sparkline } from '@/components/sparkline'
import { useRouter } from 'next/navigation'
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
}

export function PredictionHistoryList({ checks, predictions, className, marketId, showChecks = true, showPredictions = true }: PredictionHistoryListProps) {
  const router = useRouter()
  const hasChecks = !!checks && checks.length > 0
  const hasPredictions = !!predictions && predictions.length > 0
  const renderChecks = showChecks && hasChecks
  const renderPredictions = showPredictions && hasPredictions
  if (!renderChecks && !renderPredictions) return null

  const handlePredictionClick = (predictionId: string) => {
    router.push(`/prediction/${predictionId}`)
  }

  // Color coding based on delta magnitude (reused from prediction components)
  const getDeltaColor = (delta: number | null) => {
    if (delta == null) return 'text-muted-foreground'
    if (delta >= 0.10) return 'text-green-600' // High disagreement - major AI insight!
    if (delta >= 0.05) return 'text-yellow-600' // Small disagreement
    return 'text-foreground' // Close agreement - no color
  }

  return (
    <div className={className}>
      {renderChecks && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Sparkline values={checks!.map(c => c.delta ?? 0)} height={40} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Time</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks!.map((c, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatPercent(c.aiProbability)}</TableCell>
                    <TableCell className="tabular-nums">{formatPercent(c.marketProbability)}</TableCell>
                    <TableCell className="tabular-nums">{formatPercent(c.delta)}</TableCell>
                    <TableCell>{c.marketClosed ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {renderPredictions && (
        <Card>
          <CardHeader>
            <CardTitle>Past Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Time</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Market Prob</TableHead>
                  <TableHead className="text-right">AI Pred</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Delta</TableHead>
                  <TableHead className="hidden md:table-cell">Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions!.map((p, idx) => {
                  const aiP0 = Array.isArray(p.outcomesProbabilities) ? p.outcomesProbabilities[0] : null
                  const marketP0 = Array.isArray(p.marketOutcomePrices) ? p.marketOutcomePrices[0] : null
                  
                  // Calculate delta
                  const aiProb = toUnitProbability(aiP0)
                  const marketProb = toUnitProbability(marketP0)
                  const delta = aiProb != null && marketProb != null ? Math.abs(marketProb - aiProb) : null
                  
                  const isClickable = !!p.id
                  
                  return (
                    <TableRow 
                      key={idx}
                      className={isClickable ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                      onClick={isClickable ? () => handlePredictionClick(p.id!) : undefined}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatPercent(marketP0)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div>{formatPercent(aiP0)}</div>
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          {marketP0 ? `Mkt: ${formatPercent(marketP0)}` : ''}
                          {delta !== null && (
                            <span className={`ml-2 ${getDeltaColor(delta)}`}>
                              Δ{formatPercent(delta)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right tabular-nums hidden sm:table-cell ${getDeltaColor(delta)}`}>
                        {delta !== null ? formatPercent(delta) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{p.modelName || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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


