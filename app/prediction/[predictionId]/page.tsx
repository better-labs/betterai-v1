import { notFound } from "next/navigation"
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'

import * as predictionCheckService from '@/lib/services/prediction-check-service'
import { PredictionHistoryList } from "@/features/prediction/PredictionHistoryList.client"
import MarketWithPredictionCard from '@/features/market/market-with-prediction-card.client'
import type { PredictionDTO, PredictionCheckDTO } from "@/lib/types"
import { PredictionDetailCard } from "@/features/prediction/prediction-detail-card.client"
import { components } from "@/lib/design-system"

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  const prediction = await predictionService.getPredictionWithRelationsByIdSerialized(prisma, id)
  if (!prediction) return notFound()

  const market = prediction.market
  const event = market?.event || null

  // const eventExternalUrl = event?.id ? await generateEventURL(event.id) : null
  // const marketExternalUrl = market?.id ? await generateMarketURL(market.id) : null



  // Optional history: recent checks and past predictions for this market
  const marketId = market?.id
  const [checks, pastPredictions]: [PredictionCheckDTO[], PredictionDTO[]] = await Promise.all([
    marketId ? predictionCheckService.getRecentByMarket(prisma, marketId, 25) : Promise.resolve([]),
    marketId ? predictionService.getPredictionsByMarketIdSerialized(prisma, marketId) : Promise.resolve([]),
  ])

  // Data is already converted to DTOs by the service
  const marketDTO = market
  const eventDTO = event

  return (
    <div className={components.page.container}>
      <div className={components.page.content}>
        {/* Page Header */}
        <div className={components.pageHeader.container}>
          <h1 className={components.pageHeader.title}>
            Prediction Detail
          </h1>
        </div>

        {/* Main Content Sections */}
        <div className={components.page.sections}>
          {/* Market Card with current prediction */}
          {marketDTO && eventDTO && (
            <MarketWithPredictionCard
              market={marketDTO}
              event={eventDTO}
              latestPrediction={prediction}
              className="w-full"
              hideReasoning={true}
            />
          )}

          {/* Prediction Detail Card */}
          <PredictionDetailCard
            predictionResult={prediction.predictionResult}
            serializedPrediction={prediction}
            title="Prediction Detail"
            description="AI-generated prediction for this market"
            showMakePredictionButton={false}
            makePredictionHref="/"
          />

          {/* Prediction History */}
          <PredictionHistoryList
            checks={checks}
            predictions={pastPredictions}
            marketId={marketId ?? null}
            showChecks={false}
            showPredictions={true}
            currentMarketOutcomePrices={marketDTO?.outcomePrices ?? null}
          />
        </div>
      </div>
    </div>
  )
}


