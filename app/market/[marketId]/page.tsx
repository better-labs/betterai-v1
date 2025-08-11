import { notFound } from 'next/navigation'
import { marketQueries, predictionQueries, eventQueries } from '@/lib/db/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, BarChart2, TrendingUp, Tag } from 'lucide-react'
import Link from 'next/link'
import { formatVolume, generateMarketURL } from '@/lib/utils'
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
  const externalMarketUrl = await generateMarketURL(marketId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Event: {event.title}
                      </h3>
                      {event.endDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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

        {/* Prediction Section */}
        <div className="space-y-6">
          {/* Market Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Market: {market.question}
                <Badge variant={market.active ? "default" : "secondary"}>
              {market.active ? "Active" : "Closed"}
            </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>

              
               {/* Market Metadata */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground">
                    {`Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown'}`}
                  </p>
                </div>
                
                {/* Market Outcomes */}
                <div className="grid grid-cols-1 gap-6">
                  {market.outcomePrices && market.outcomePrices.length > 0 && (
                    
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Outcomes</h4>
                          {market.outcomePrices.map((price, index) => (
                            <div key={index} className="flex justify-between items-center py-1.5">
                              <span className="text-2xl font-semibold leading-tight">{market.outcomes?.[index] || `Outcome ${index + 1}`}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-right">Market Probability</h4>
                          {market.outcomePrices.map((price, index) => (
                            <div key={index} className="flex justify-end py-1.5">
                              <span className="text-4xl font-extrabold text-primary tabular-nums">{(Number(price) * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>

                {/* External Provider Link */}
                {externalMarketUrl && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground">
                      <a
                        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        href={externalMarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Market on {event?.marketProvider ?? 'provider'}
                      </a>
                    </p>
                  </div>
                )}
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

       

        {/* Market Description */}
        {market.description && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Market Description</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Key Stats moved from Market Details */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Volume {formatVolume(Number(market.volume) || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Liquidity {formatVolume(Number(market.liquidity) || 0)}</span>
                </div>
                {market.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Market Close Date {new Date(market.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                {market.description}
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