import { notFound } from "next/navigation"
import { createCallerFactory } from "@/lib/trpc/init"
import { appRouter } from "@/lib/trpc/root"
import { createTRPCContext } from "@/lib/trpc/init"
import { getPredictionDisplayData } from "@/lib/utils"
import { PredictionSummaryCard } from "@/components/prediction-summary-card"
import { PredictionReasoningCard } from "@/components/prediction-reasoning-card"
import type { PredictionResult } from "@/lib/types"
import { PredictionHistoryList } from "@/components/prediction-history-list"
import { MarketEventHeader } from "@/components/market-event-header"
import { PredictionUserMessageCard } from "@/components/prediction-user-message-card"
import { headers } from "next/headers"

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  // Create server-side tRPC caller
  const createCaller = createCallerFactory(appRouter)
  const caller = createCaller(await createTRPCContext({ 
    headers: await headers() 
  }))

  // Fetch prediction data using tRPC (automatic serialization!)
  const prediction = await caller.prediction.getById({ id })
  if (!prediction) return notFound()

  const market = prediction.market
  const event = market?.event || null

  const { aiProbability, reasoning, marketProbability } = getPredictionDisplayData(
    prediction as any
  )

  // Derive AI outcomes/probabilities and confidence from stored data
  const aiOutcomes = prediction.outcomes ?? null
  const aiOutcomesProbabilities = prediction.outcomesProbabilities ?? null
  const predictionResult = prediction.predictionResult as PredictionResult | null
  const confidenceLevel = predictionResult?.confidence_level ?? null

  // Fetch related data using tRPC
  const marketId = market?.id
  const [checks, pastPredictions] = await Promise.all([
    marketId ? caller.prediction.getChecksByMarketId({ marketId, limit: 25 }) : Promise.resolve([]),
    marketId ? caller.prediction.getByMarketId({ marketId }) : Promise.resolve([]),
  ])

  // No more manual serialization needed! 🎉

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
          createdAt={prediction.createdAt}
        />

        <PredictionReasoningCard reasoning={reasoning} />


        {/* First: Prompt message */}
        <PredictionUserMessageCard userMessage={prediction.userMessage} />

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


