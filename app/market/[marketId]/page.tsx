import { notFound } from 'next/navigation'
import { marketQueries, predictionQueries, eventQueries } from '@/lib/db/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, BarChart2, TrendingUp, Tag } from 'lucide-react'
import Link from 'next/link'
import { formatVolume } from '@/lib/utils'
import type { PredictionResult } from '@/lib/types'

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

  // Fetch most recent prediction
  const prediction = await predictionQueries.getMostRecentPredictionByMarketId(marketId)
  const predictionResult = prediction?.predictionResult as PredictionResult | null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Event Information */}
        {event && (
          <Link href={`/event/${event.id}`}>
            <Card className="mb-6 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {event.icon && (
                    <img 
                      src={event.icon} 
                      alt={event.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-muted-foreground mb-4">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.endDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>End Date: {new Date(event.endDate as Date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Market Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {market.question}
              </h1>
              {market.description && (
                <p className="text-muted-foreground mb-4">
                  {market.description}
                </p>
              )}
            </div>
            <Badge variant={market.active ? "default" : "secondary"}>
              {market.active ? "Active" : "Closed"}
            </Badge>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="font-semibold">{formatVolume(Number(market.volume) || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Liquidity</p>
                <p className="font-semibold">{formatVolume(Number(market.liquidity) || 0)}</p>
              </div>
            </div>
            {market.endDate && (
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {new Date(market.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Market Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Details
              </CardTitle>
              <CardDescription>
                Current market information and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {market.outcomePrices && market.outcomePrices.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Outcome Prices</h4>
                  <div className="space-y-1">
                    {market.outcomePrices.map((price, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>Outcome {index + 1}:</span>
                        <span className="font-medium">${Number(price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <p className="text-sm text-muted-foreground">
                  {market.updatedAt ? new Date(market.updatedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

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
                      <span className="text-2xl font-bold">
                        {(predictionResult.probability * 100).toFixed(1)}%
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ 
                            width: `${predictionResult.probability * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>



                  {predictionResult.reasoning && (
                    <div>
                      <h4 className="font-medium mb-2">Reasoning</h4>
                      <p className="text-sm text-muted-foreground">
                        {predictionResult.reasoning}
                      </p>
                    </div>
                  )}



                  {prediction && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Prediction made on {new Date(prediction.createdAt as Date).toLocaleString()}
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

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/">
              Back to Markets
            </Link>
          </Button>
          {prediction && (
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