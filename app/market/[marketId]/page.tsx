import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import * as marketService from '@/lib/services/market-service'
import * as predictionService from '@/lib/services/prediction-service'
import * as eventService from '@/lib/services/event-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Calendar, DollarSign, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { formatVolume, generateMarketURL } from '@/lib/utils'
import type { PredictionResult } from '@/lib/types'
import MarketDetailsCard from '@/features/market/MarketCard.client'
import { MarketEventHeader } from '@/features/market/MarketEventHeader'
import { PredictionReasoningCard } from '@/features/prediction/PredictionReasoningCard.client'
import { PredictionHistoryList } from '@/features/prediction/PredictionHistoryList.client'
import { mapPredictionsToDTO } from '@/lib/dtos/prediction-dto'
import type { EventDTO, MarketDTO, PredictionDTO } from '@/lib/types'

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

interface MarketDetailPageProps {
  params: Promise<{
    marketId: string
  }>
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { marketId } = await params

  // Fetch market data
  const market = await marketService.getMarketByIdSerialized(prisma, marketId) as unknown as MarketDTO | null
  if (!market) {
    notFound()
  }

  // Fetch event data if market has an eventId
  const event = market.eventId ? await eventService.getEventByIdSerialized(prisma, market.eventId) as unknown as EventDTO | null : null

  // Fetch most recent prediction and all predictions for history
  const [prediction, allPredictions] = await Promise.all([
    predictionService.getMostRecentPredictionByMarketIdSerialized(prisma, marketId) as unknown as Promise<PredictionDTO | null>,
    predictionService.getPredictionsByMarketIdSerialized(prisma, marketId) as unknown as Promise<PredictionDTO[]>
  ])

  const serializedMarket = market
  const serializedEvent = event
  const serializedPrediction = prediction
  const serializedAllPredictions = allPredictions

  const predictionResult = serializedPrediction?.predictionResult as PredictionResult | null
  const externalMarketUrl = await generateMarketURL(marketId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        

        {/* Prediction Section */}
        <div className="space-y-6">
          {/* Market Details Card */}
          <MarketDetailsCard
            market={serializedMarket}
            event={serializedEvent}
            externalMarketUrl={externalMarketUrl}
            latestPrediction={serializedPrediction}
          />

          {/* Most Recent Prediction */}
          <Card>
            <CardHeader>
              <CardTitle>Most Recent Prediction</CardTitle>
              <CardDescription>
                AI-generated prediction for this market
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
                  <Button asChild>
                    <Link href="/">
                      Make a Prediction
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

       

        {/* Market Description */}
        {serializedMarket.description && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Market Description</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Key Stats moved from Market Details */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Volume {formatVolume(Number(serializedMarket.volume) || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Liquidity {formatVolume(Number(serializedMarket.liquidity) || 0)}</span>
                </div>
                {serializedMarket.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Market Close Date {new Date(serializedMarket.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                {serializedMarket.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Past Predictions */}
        {serializedAllPredictions.length > 1 && (
          <PredictionHistoryList
            predictions={mapPredictionsToDTO(serializedAllPredictions as any)}
            marketId={marketId}
            showChecks={false}
            showPredictions={true}
            className="mt-8"
            currentMarketOutcomePrices={serializedMarket.outcomePrices ?? null}
          />
        )}

         {/* Action Buttons */}
         <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/">
              Back to Markets
            </Link>
          </Button>
          {serializedPrediction && (
            <Button variant="outline" asChild>
              <Link href={`/market/${marketId}/predictions`}>
                View All Predictions
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 