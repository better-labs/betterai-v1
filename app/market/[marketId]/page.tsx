import { notFound } from 'next/navigation'
import { marketQueries, predictionQueries, eventQueries } from '@/lib/db/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { formatVolume, generateMarketURL } from '@/lib/utils'
import type { PredictionResult } from '@/lib/types'
import MarketDetailsCard from '@/components/market-details-card'
import { MarketEventHeader } from '@/components/market-event-header'
import { PredictionReasoningCard } from '@/components/prediction-reasoning-card'
import { PredictionHistoryList } from '@/components/prediction-history-list'
import { serializePredictionData, serializeDecimals } from '@/lib/serialization'

interface MarketDetailPageProps {
  params: Promise<{
    marketId: string
  }>
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { marketId } = await params

  // Fetch market data
  const market = await marketQueries.getMarketById(marketId)
  if (!market) {
    notFound()
  }

  // Fetch event data if market has an eventId
  const event = market.eventId ? await eventQueries.getEventById(market.eventId) : null

  // Fetch most recent prediction and all predictions for history
  const [prediction, allPredictions] = await Promise.all([
    predictionQueries.getMostRecentPredictionByMarketId(marketId),
    predictionQueries.getPredictionsByMarketId(marketId)
  ])

  // Serialize all data to handle Decimal objects
  const serializedMarket = serializeDecimals(market)
  const serializedEvent = event ? serializeDecimals(event) : null
  const serializedPrediction = prediction ? serializeDecimals(prediction) : null
  const serializedAllPredictions = serializeDecimals(allPredictions)

  const predictionResult = serializedPrediction?.predictionResult as PredictionResult | null
  const externalMarketUrl = await generateMarketURL(marketId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Event/Market Header */}
        <MarketEventHeader
          className="mb-6"
          size="lg"
          eventId={serializedEvent?.id ?? null}
          eventTitle={serializedEvent?.title ?? null}
          eventImage={serializedEvent?.image ?? null}
          eventIcon={serializedEvent?.icon ?? null}
          marketId={serializedMarket.id}
          marketQuestion={serializedMarket.question}
        />

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
                        collapsedHeight="7rem"
                        showHeader={false}
                        className="border-0 shadow-none bg-transparent"
                      />
                    </div>
                  )}



                  {serializedPrediction && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Prediction made on {new Date(serializedPrediction.createdAt as Date).toLocaleString()}
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

          {/* Past Predictions */}
          {serializedAllPredictions.length > 1 && (
            <PredictionHistoryList
              predictions={serializePredictionData(serializedAllPredictions)}
              marketId={marketId}
              showChecks={false}
              showPredictions={true}
              className="mt-6"
            />
          )}
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