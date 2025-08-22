import { notFound } from 'next/navigation'
import { eventQueries, marketQueries, predictionQueries } from '@/lib/db/queries'
import { MarketEventHeader } from '@/components/market-event-header'
import { PredictionSummaryCard } from '@/components/prediction-summary-card'
import type { PredictionResult } from '@/lib/types'
import { serializeDecimals } from '@/lib/serialization'

type PageParams = { marketId: string }
type PageProps = { params: Promise<PageParams> }

export default async function MarketPredictionsPage({ params }: PageProps) {
  const { marketId } = await params

  const market = await marketQueries.getMarketById(marketId)
  if (!market) return notFound()

  const event = market.eventId ? await eventQueries.getEventById(market.eventId) : null
  const predictions = await predictionQueries.getPredictionsByMarketId(marketId)

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <MarketEventHeader
          className="mb-6"
          size="lg"
          eventId={event?.id ?? null}
          eventTitle={event?.title ?? null}
          eventImage={event?.image ?? null}
          eventIcon={event?.icon ?? null}
          marketId={market.id}
          marketQuestion={market.question}
        />

        <div className="mb-4">
          <h2 className="text-xl font-semibold">All Predictions</h2>
          <p className="text-sm text-muted-foreground">{predictions.length} total</p>
        </div>

        {predictions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No predictions yet for this market.</div>
        ) : (
          <div className="space-y-6">
            {predictions.map((p) => {
              const predictionResult = (p as any).predictionResult as PredictionResult | null
              const aiOutcomes = (p as any).outcomes ?? null
              const aiOutcomesProbabilities = serializeDecimals((p as any).outcomesProbabilities) ?? null
              const confidenceLevel = predictionResult?.confidence_level ?? null

              return (
                <PredictionSummaryCard
                  key={p.id}
                  marketOutcomes={market.outcomes ?? null}
                  marketOutcomePrices={serializeDecimals((market as any).outcomePrices) ?? null}
                  aiOutcomes={aiOutcomes}
                  aiOutcomesProbabilities={aiOutcomesProbabilities}
                  confidenceLevel={confidenceLevel}
                  modelName={(p as any).modelName ?? null}
                  createdAt={p.createdAt as any}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


