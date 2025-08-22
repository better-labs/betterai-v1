"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPercent } from '@/lib/utils'
import Link from 'next/link'
import { Sparkline } from '@/components/sparkline'
import { useRouter } from 'next/navigation'

type CheckItem = {
  createdAt: Date | string
  aiProbability?: unknown | null
  marketProbability?: unknown | null
  delta?: unknown | null
  marketClosed?: boolean | null
}

type PredictionItem = {
  id?: string | null
  createdAt: Date | string
  modelName?: string | null
  outcomesProbabilities?: Array<unknown> | null
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
                  <TableHead>AI Prediction</TableHead>
                  <TableHead>Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions!.map((p, idx) => {
                  const p0 = Array.isArray(p.outcomesProbabilities) ? p.outcomesProbabilities[0] : null
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
                      <TableCell className="tabular-nums">{formatPercent(p0)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.modelName || '—'}</TableCell>
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


