import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PredictionGeneratorV2 } from '@/features/prediction/prediction-generator-v2.client'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { MarketOverviewCard } from '@/features/market/market-overview-card.client'
import { mapMarketToDTO } from '@/lib/dtos/market-dto'
import { mapEventToDTO } from '@/lib/dtos/event-dto'
import { generateMarketURL } from '@/lib/server-utils'
import { isMarketOpenForBetting } from '@/lib/utils/market-status'
interface PredictPageProps {
  params: Promise<{ marketId: string }>
}

// Get market data on server side
async function getMarket(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      event: true
    }
  })

  return market
}

export default async function PredictPage({ params }: PredictPageProps) {
  const { marketId } = await params
  const market = await getMarket(marketId)

  if (!market) {
    notFound()
  }

  // Check if market is open for betting - redirect if not
  if (!isMarketOpenForBetting(market)) {
    redirect(`/market/${marketId}`)
  }

  // Convert to DTOs for client components
  const marketDTO = mapMarketToDTO(market)
  const eventDTO = mapEventToDTO(market.event)
  const externalMarketUrl = await generateMarketURL(market.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Predict with AI</h1>
          <p className="text-muted-foreground">
            Generate AI predictions with enhanced research from multiple sources
          </p>
        </div>

        {/* Market Card */}
        <MarketOverviewCard
          market={marketDTO}
          event={eventDTO}
          externalMarketUrl={externalMarketUrl}
        />

        {/* Generator Component */}
        <Suspense fallback={<GeneratorSkeleton />}>
          <PredictionGeneratorV2 marketId={marketId} />
        </Suspense>
      </div>
    </div>
  )
}

// Loading skeleton for the generator
function GeneratorSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}