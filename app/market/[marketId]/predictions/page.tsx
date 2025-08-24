import { notFound } from 'next/navigation'
import { eventQueries, marketQueries, predictionQueries } from '@/lib/db/queries'
import { MarketEventHeader } from '@/features/market/MarketEventHeader'
import { PredictionSummaryCard } from '@/components/prediction-summary-card'
import type { PredictionResult } from '@/lib/types'
import { serializeDecimals } from '@/lib/serialization'
import type { EventDTO, MarketDTO, PredictionDTO } from '@/lib/types'

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

type PageParams = { marketId: string }
type PageProps = { params: Promise<PageParams> }

export default async function MarketPredictionsPage({ params }: PageProps) {
  const { marketId } = await params

  const market = await marketQueries.getMarketByIdSerialized(marketId) as unknown as MarketDTO | null
  if (!market) return notFound()

  const event = market.eventId ? await eventQueries.getEventByIdSerialized(market.eventId) as unknown as EventDTO | null : null
  const predictions = await predictionQueries.getPredictionsByMarketIdSerialized(marketId) as unknown as PredictionDTO[]

  const serializedMarket = market
  const serializedEvent = event
  const serializedPredictions = predictions

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
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

        <div className="mb-4">
          <h2 className="text-xl font-semibold">All Predictions</h2>
          <p className="text-sm text-muted-foreground">{serializedPredictions.length} total</p>
        </div>

        {serializedPredictions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No predictions yet for this market.</div>
        ) : (
          <div className="space-y-6">
            {serializedPredictions.map((p) => {
              const predictionResult = (p as any).predictionResult as PredictionResult | null
              const aiOutcomes = (p as any).outcomes ?? null
              const aiOutcomesProbabilities = (p as any).outcomesProbabilities ?? null
              const confidenceLevel = predictionResult?.confidence_level ?? null

              return (
                <PredictionSummaryCard
                  key={p.id}
                  marketOutcomes={serializedMarket.outcomes ?? null}
                  marketOutcomePrices={serializedMarket.outcomePrices ?? null}
                  aiOutcomes={aiOutcomes}
                  aiOutcomesProbabilities={aiOutcomesProbabilities}
                  confidenceLevel={confidenceLevel}
                  modelName={(p as any).modelName ?? null}
                  createdAt={p.createdAt}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


