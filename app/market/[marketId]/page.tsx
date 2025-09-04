import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import * as marketService from '@/lib/services/market-service'
import * as predictionService from '@/lib/services/prediction-service'
import * as eventService from '@/lib/services/event-service'
import { generateMarketURL } from '@/lib/server-utils'
import type { PredictionResult } from '@/lib/types'
import MarketWithPredictionCard from '@/features/market/market-with-prediction-card.client'
import { MarketDescriptionCard } from '@/features/market/market-description-card.client'
import { MarketStalenessHandler } from '@/features/market/MarketStalenessHandler.client'
import { PredictionDetailCard } from '@/features/prediction/PredictionDetailCard.client'
import { PredictionHistoryList } from '@/features/prediction/PredictionHistoryList.client'
import type { EventDTO, MarketDTO, PredictionDTO } from '@/lib/types'
import { components } from '@/lib/design-system'
import { MarketOverviewCard } from '@/features/market/market-overview-card.client'

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

interface MarketDetailPageProps {
  params: Promise<{
    marketId: string
  }>
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { marketId } = await params

  // Fetch market data
  const market = await marketService.getMarketByIdSerialized(prisma, marketId) as unknown as MarketDTO | null
  if (!market) {
    notFound()
  }

  // Fetch event data if market has an eventId
  const event = market.eventId ? await eventService.getEventByIdSerialized(prisma, market.eventId) as unknown as EventDTO | null : null

  // Fetch most recent prediction and all predictions for history
  const [prediction, allPredictions] = await Promise.all([
    predictionService.getMostRecentPredictionByMarketIdSerialized(prisma, marketId) as unknown as Promise<PredictionDTO | null>,
    predictionService.getPredictionsByMarketIdSerialized(prisma, marketId) as unknown as Promise<PredictionDTO[]>
  ])

  const serializedMarket = market
  const serializedEvent = event
  const serializedPrediction = prediction
  const serializedAllPredictions = allPredictions

  const predictionResult = serializedPrediction?.predictionResult as PredictionResult | null
  const externalMarketUrl = await generateMarketURL(marketId)

  return (
    <div className={components.page.container}>
      <div className={components.page.content}>
        {/* Page Header */}
        <div className={components.pageHeader.container}>
          <h1 className={components.pageHeader.title}>
            Market Detail
          </h1>
        </div>

        {/* Market Staleness Handler - Auto-refresh if data is old */}
        <MarketStalenessHandler market={serializedMarket} />

        {/* Main Content Sections */}
        <div className={components.page.sections}>
          {/* Market Details Card */}
          <MarketWithPredictionCard
            market={serializedMarket}
            event={serializedEvent}
            externalMarketUrl={externalMarketUrl}
            latestPrediction={serializedPrediction}
          />
          {/* Market Overview */}
          <MarketOverviewCard market={serializedMarket} externalMarketUrl={externalMarketUrl} event={serializedEvent} />
         
          {/* Most Recent Prediction */}
          <PredictionDetailCard
            predictionResult={predictionResult}
            serializedPrediction={serializedPrediction}
          />
        </div>

        {/* Past Predictions */}
        {serializedAllPredictions.length > 1 && (
          <PredictionHistoryList
            predictions={serializedAllPredictions}
            marketId={marketId}
            showChecks={false}
            showPredictions={true}
            className="mt-8"
            currentMarketOutcomePrices={serializedMarket.outcomePrices ?? null}
          />
        )}
      </div>
    </div>
  )
} 