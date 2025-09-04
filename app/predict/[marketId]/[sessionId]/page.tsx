import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PredictionResults } from '@/features/prediction/PredictionResults.client'
import { Card, CardContent } from '@/shared/ui/card'
import { StatsDisplaySection } from '@/shared/ui/stats-display-section.client'
import { Skeleton } from '@/shared/ui/skeleton'

interface PredictionResultsPageProps {
  params: Promise<{ marketId: string; sessionId: string }>
}

// Get market data on server side for better SEO and initial render
async function getMarket(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
        }
      }
    }
  })

  return market
}

export default async function PredictionResultsPage({ params }: PredictionResultsPageProps) {
  const { marketId, sessionId } = await params
  const market = await getMarket(marketId)

  if (!market) {
    notFound()
  }

  // Normalize Prisma Decimal[] -> number[] for UI components
  const outcomePrices: number[] | null = Array.isArray(market.outcomePrices)
    ? market.outcomePrices.map((v) => Number(v))
    : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">AI Prediction Results</h1>
         
        </div>

        {/* Market Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{market.question}</h2>
              <StatsDisplaySection
                title="Market Probability"
                stats={(market.outcomes || []).map((outcome, index) => ({
                  label: outcome,
                  value: outcomePrices?.[index] || null
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Component */}
        <Suspense fallback={<ResultsSkeleton />}>
          <PredictionResults 
            sessionId={sessionId}
            marketId={marketId} 
          />
        </Suspense>
      </div>
    </div>
  )
}

// Loading skeleton for the results
function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Status skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Model cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}