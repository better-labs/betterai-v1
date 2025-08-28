import { notFound } from "next/navigation"
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'
import { getPredictionDisplayData } from "@/lib/utils"
import { PredictionReasoningCard } from "@/features/prediction/PredictionReasoningCard.client"

import * as predictionCheckService from '@/lib/services/prediction-check-service'
import { PredictionHistoryList } from "@/features/prediction/PredictionHistoryList.client"
import MarketDetailsCard from '@/features/market/MarketCard.client'
import { mapMarketToDTO } from '@/lib/dtos/market-dto'
import { mapEventToDTO } from '@/lib/dtos/event-dto'
import { mapPredictionToDTO } from '@/lib/dtos/prediction-dto'
import { mapPredictionsToDTO } from '@/lib/dtos/prediction-dto'
import type { PredictionDTO, PredictionCheckDTO } from "@/lib/types"
import { PredictionDetailCard } from "@/features/prediction/PredictionDetailCard.client"
import { components } from "@/lib/design-system"

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

  const market = prediction.market
  const event = market?.event || null

  const { reasoning } = getPredictionDisplayData(prediction as any)

  // const eventExternalUrl = event?.id ? await generateEventURL(event.id) : null
  // const marketExternalUrl = market?.id ? await generateMarketURL(market.id) : null



  // Optional history: recent checks and past predictions for this market
  const marketId = market?.id
  const [checks, pastPredictions]: [PredictionCheckDTO[], PredictionDTO[]] = await Promise.all([
    marketId ? predictionCheckService.getRecentByMarket(prisma, marketId, 25) : Promise.resolve([]),
    marketId ? predictionService.getPredictionsByMarketIdSerialized(prisma, marketId) : Promise.resolve([]),
  ])

  // Convert to DTOs for client components
  const marketDTO = market ? mapMarketToDTO(market) : null
  const eventDTO = event ? mapEventToDTO(event) : null

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
            <MarketDetailsCard
              market={marketDTO}
              event={eventDTO}
              latestPrediction={mapPredictionToDTO(prediction as any)}
              className="w-full"
              hideReasoning={true}
            />
          )}

          {/* Prediction Detail Card */}
          <PredictionDetailCard
            predictionResult={prediction.predictionResult}
            serializedPrediction={mapPredictionToDTO(prediction as any)}
            title="Prediction Detail"
            description="AI-generated prediction for this market"
            showMakePredictionButton={false}
            makePredictionHref="/"
          />

          {/* Prediction History */}
          <PredictionHistoryList
            checks={checks}
            predictions={mapPredictionsToDTO(pastPredictions as any)}
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


