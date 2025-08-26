import { notFound } from "next/navigation"
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'
import { getPredictionDisplayData } from "@/lib/utils"
import { PredictionSummaryCard } from "@/features/prediction/PredictionSummaryCard"
import { PredictionReasoningCard } from "@/features/prediction/PredictionReasoningCard.client"
import type { PredictionResult } from "@/lib/types"
import * as predictionCheckService from '@/lib/services/prediction-check-service'
import { PredictionHistoryList } from "@/features/prediction/PredictionHistoryList.client"
import { MarketEventHeader } from "@/features/market/MarketEventHeader"
import { PredictionUserMessageCard } from "@/features/prediction/PredictionUserMessageCard.client"
import type { PredictionDTO, PredictionCheckDTO } from "@/lib/types"

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  const prediction = await predictionService.getPredictionWithRelationsByIdSerialized(prisma, id) as unknown as (PredictionDTO & { market: any | null }) | null
  if (!prediction) return notFound()

  const serializedPrediction = prediction
  const market = serializedPrediction.market
  const event = market?.event || null

  const { reasoning } = getPredictionDisplayData(
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
    marketId ? predictionCheckService.getRecentByMarketSerialized(prisma, marketId, 25) : Promise.resolve([]),
    marketId ? predictionService.getPredictionsByMarketIdSerialized(prisma, marketId) : Promise.resolve([]),
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
          marketId={marketId ?? null}
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


