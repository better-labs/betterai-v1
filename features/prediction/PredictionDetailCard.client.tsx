'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import Link from 'next/link'
import type { PredictionResult } from '@/lib/types'
import { PredictionReasoningCard } from '@/features/prediction/PredictionReasoningCard.client'
import type { PredictionDTO } from '@/lib/types'

interface PredictionDetailCardProps {
  predictionResult: PredictionResult | null
  serializedPrediction: PredictionDTO | null
  title?: string
  description?: string
  showMakePredictionButton?: boolean
  makePredictionHref?: string
  className?: string
}

export function PredictionDetailCard({
  predictionResult,
  serializedPrediction,
  title = "Most Recent Prediction",
  description = "AI-generated prediction for this market",
  showMakePredictionButton = true,
  makePredictionHref = "/",
  className
}: PredictionDetailCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictionResult ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Prediction</h4>
              <p className="text-lg font-semibold text-primary">
                {predictionResult.prediction}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Probability</h4>
              <div className="flex items-center gap-3">
                {(() => {
                  const p0 = Array.isArray(predictionResult.outcomesProbabilities) ? predictionResult.outcomesProbabilities[0] : null
                  const pct = typeof p0 === 'number' ? Math.round(p0 * 100) : null
                  return (
                    <>
                      <span className="text-2xl font-bold">{pct !== null ? `${pct}%` : '--'}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: pct !== null ? `${pct}%` : '0%' }}
                        />
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {predictionResult.reasoning && (
              <div>
                <h4 className="font-medium mb-2">Reasoning</h4>
                <PredictionReasoningCard 
                  reasoning={predictionResult.reasoning}
                  showHeader={false}
                  className="border-0 shadow-none bg-transparent"
                />
              </div>
            )}

            {predictionResult.confidence_level && (
              <div>
                <h4 className="font-medium mb-2">Confidence: {predictionResult.confidence_level}</h4>
              </div>
            )}

            {serializedPrediction && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Prediction made on {new Date(serializedPrediction.createdAt as unknown as string).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No predictions available for this market yet.
            </p>
            {showMakePredictionButton && (
              <Button asChild>
                <Link href={makePredictionHref}>
                  Make a Prediction
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
