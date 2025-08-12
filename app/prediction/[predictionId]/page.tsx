import { notFound } from "next/navigation"
import { predictionQueries } from "@/lib/db/queries"
import { getPredictionDisplayData } from "@/lib/utils"
import { PredictionSummaryCard } from "@/components/prediction-summary-card"
import { PredictionReasoningCard } from "@/components/prediction-reasoning-card"
import type { PredictionResult } from "@/lib/types"
import { predictionCheckQueries, predictionQueries as pq } from "@/lib/db/queries"
import { PredictionHistoryList } from "@/components/prediction-history-list"
import { MarketEventHeader } from "@/components/market-event-header"
import { PredictionUserMessageCard } from "@/components/prediction-user-message-card"

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  const prediction = await predictionQueries.getPredictionWithRelationsById(id)
  if (!prediction) return notFound()

  const market = prediction.market
  const event = market?.event || null

  const { aiProbability, reasoning, marketProbability } = getPredictionDisplayData(
    prediction as any
  )

  // const eventExternalUrl = event?.id ? await generateEventURL(event.id) : null
  // const marketExternalUrl = market?.id ? await generateMarketURL(market.id) : null

  // Derive AI outcomes/probabilities and confidence from stored data
  const aiOutcomes = (prediction as any).outcomes ?? null
  const aiOutcomesProbabilities = (prediction as any).outcomesProbabilities ?? null
  const predictionResult = (prediction as any).predictionResult as PredictionResult | null
  const confidenceLevel = predictionResult?.confidence_level ?? null

  // Optional history: recent checks and past predictions for this market
  const marketId = market?.id
  const [checks, pastPredictions] = await Promise.all([
    marketId ? predictionCheckQueries.getRecentByMarket(marketId, 25) : Promise.resolve([]),
    marketId ? pq.getPredictionsByMarketId(marketId) : Promise.resolve([]),
  ])

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
        marketId={market?.id ?? null}
        marketQuestion={market?.question ?? prediction.userMessage}
      />

      <div className="space-y-6">
        <PredictionSummaryCard
          marketOutcomes={market?.outcomes ?? null}
          marketOutcomePrices={market?.outcomePrices ?? null}
          aiOutcomes={aiOutcomes}
          aiOutcomesProbabilities={aiOutcomesProbabilities}
          confidenceLevel={confidenceLevel}
          modelName={prediction.modelName ?? null}
          createdAt={prediction.createdAt as any}
        />

        <PredictionReasoningCard reasoning={reasoning} />


        <PredictionHistoryList
          className="mt-2"
          checks={checks?.map((c) => ({
            createdAt: c.createdAt as any,
            aiProbability: (c as any).aiProbability,
            marketProbability: (c as any).marketProbability,
            delta: (c as any).absDelta ?? (c as any).delta,
            marketClosed: c.marketClosed ?? null,
          }))}
          predictions={pastPredictions?.map((p) => ({
            createdAt: p.createdAt as any,
            modelName: p.modelName ?? null,
            outcomesProbabilities: (p as any).outcomesProbabilities ?? null,
          }))}
          marketId={marketId ?? null}
        />

        <PredictionUserMessageCard userMessage={prediction.userMessage} />
      </div>
      </div>
    </div>
  )
}


