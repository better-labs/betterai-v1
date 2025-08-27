"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { formatPercent } from '@/lib/utils'
import { computeDeltaFromArrays } from '@/lib/delta'
import Link from 'next/link'
import { Sparkline } from '@/shared/ui/charts/sparkline.client'
import { useRouter } from 'next/navigation'
import { RefreshCw, Eye } from 'lucide-react'
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
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="hidden md:table-cell">Model</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions!.map((p, idx) => {
                  const delta = computeDeltaFromArrays(
                    Array.isArray(p.marketOutcomePrices) ? (p.marketOutcomePrices as unknown[]) : null,
                    Array.isArray(p.outcomesProbabilities) ? (p.outcomesProbabilities as unknown[]) : null
                  )
                  
                  const isClickable = !!p.id
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${getDeltaColor(delta)}`}>
                        {delta !== null ? formatPercent(delta) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{p.modelName || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          
                          {isClickable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePredictionClick(p.id!)
                              }}
                              className="flex items-center gap-1"
                              data-debug-id="view-prediction-button"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
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


