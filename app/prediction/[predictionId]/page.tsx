import { notFound } from "next/navigation"
import { predictionQueries } from "@/lib/db/queries"
import { getPredictionDisplayData } from "@/lib/utils"
import { PredictionSummaryCard } from "@/components/shared/prediction-summary-card"
import { PredictionReasoningCard } from "@/components/shared/prediction-reasoning-card"
import type { PredictionResult } from "@/lib/types"
import { predictionCheckQueries, predictionQueries as pq } from "@/lib/db/queries"
import { PredictionHistoryList } from "@/components/client/prediction-history-list"
import { MarketEventHeader } from "@/components/shared/market-event-header"
import { PredictionUserMessageCard } from "@/components/shared/prediction-user-message-card"
import { serializeDecimals } from "@/lib/serialization"
import type { PredictionDTO, PredictionCheckDTO } from "@/lib/types"

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  const prediction = await predictionQueries.getPredictionWithRelationsByIdSerialized(id) as unknown as (PredictionDTO & { market: any | null }) | null
  if (!prediction) return notFound()

  const serializedPrediction = prediction
  const market = serializedPrediction.market
  const event = market?.event || null

  const { aiProbability, reasoning, marketProbability } = getPredictionDisplayData(
    serializedPrediction as any
  )

  // const eventExternalUrl = event?.id ? await generateEventURL(event.id) : null
  // const marketExternalUrl = market?.id ? await generateMarketURL(market.id) : null

  // Derive AI outcomes/probabilities and confidence from stored data
  const aiOutcomes = (serializedPrediction as any).outcomes ?? null
  const aiOutcomesProbabilities = (serializedPrediction as any).outcomesProbabilities ?? null
  const predictionResult = (serializedPrediction as any).predictionResult as PredictionResult | null
  const confidenceLevel = predictionResult?.confidence_level ?? null

  // Optional history: recent checks and past predictions for this market
  const marketId = market?.id
  const [checks, pastPredictions]: [PredictionCheckDTO[], PredictionDTO[]] = await Promise.all([
    marketId ? predictionCheckQueries.getRecentByMarketSerialized(marketId, 25) : Promise.resolve([]),
    marketId ? pq.getPredictionsByMarketIdSerialized(marketId) : Promise.resolve([]),
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
        marketQuestion={market?.question ?? serializedPrediction.userMessage}
      />

      <div className="space-y-6">
        <PredictionSummaryCard
          marketOutcomes={market?.outcomes ?? null}
          marketOutcomePrices={market?.outcomePrices ?? null}
          aiOutcomes={aiOutcomes}
          aiOutcomesProbabilities={aiOutcomesProbabilities}
          confidenceLevel={confidenceLevel}
          modelName={serializedPrediction.modelName ?? null}
          createdAt={serializedPrediction.createdAt}
        />

        <PredictionReasoningCard reasoning={reasoning} />


        {/* First: Prompt message */}
        <PredictionUserMessageCard userMessage={serializedPrediction.userMessage} />

        {/* Then: Past predictions only */}
        <PredictionHistoryList
          className="mt-2"
          checks={checks}
          predictions={pastPredictions}
          marketId={marketId ?? null}
          showChecks={false}
          showPredictions={true}
        />
      </div>
      </div>
    </div>
  )
}


