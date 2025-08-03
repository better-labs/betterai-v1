import { notFound } from 'next/navigation'
import { getMarketById } from '@/lib/data/markets'
import { getMostRecentPredictionByMarketId } from '@/lib/data/predictions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, BarChart2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatVolume } from '@/lib/utils'

interface MarketDetailPageProps {
  params: {
    marketId: string
  }
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { marketId } = params

  // Fetch market data
  const market = await getMarketById(marketId)
  if (!market) {
    notFound()
  }

  // Fetch most recent prediction
  const prediction = await getMostRecentPredictionByMarketId(marketId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Markets
            </Button>
          </Link>
        </div>

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
              <div>
                <h4 className="font-medium mb-2">Market ID</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {market.id}
                </p>
              </div>
              
              {market.eventId && (
                <div>
                  <h4 className="font-medium mb-2">Event ID</h4>
                  <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                    {market.eventId}
                  </p>
                </div>
              )}

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
              {prediction ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Prediction</h4>
                    <p className="text-lg font-semibold text-primary">
                      {prediction.predictionResult.prediction}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Probability</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">
                        {(prediction.predictionResult.probability * 100).toFixed(1)}%
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ 
                            width: `${prediction.predictionResult.probability * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Confidence Level</h4>
                    <Badge 
                      variant={
                        prediction.predictionResult.confidence_level === "High" ? "default" :
                        prediction.predictionResult.confidence_level === "Medium" ? "secondary" : "outline"
                      }
                    >
                      {prediction.predictionResult.confidence_level}
                    </Badge>
                  </div>

                  {prediction.predictionResult.reasoning && (
                    <div>
                      <h4 className="font-medium mb-2">Reasoning</h4>
                      <p className="text-sm text-muted-foreground">
                        {prediction.predictionResult.reasoning}
                      </p>
                    </div>
                  )}

                  {prediction.predictionResult.key_factors && prediction.predictionResult.key_factors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Factors</h4>
                      <div className="flex flex-wrap gap-1">
                        {prediction.predictionResult.key_factors.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Prediction made on {new Date(prediction.createdAt).toLocaleString()}
                    </p>
                  </div>
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