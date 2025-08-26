import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PredictionGenerator } from './PredictionGenerator'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

interface PredictPageProps {
  params: Promise<{ marketId: string }>
}

// Get market data on server side
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

export default async function PredictPage({ params }: PredictPageProps) {
  const { marketId } = await params
  const market = await getMarket(marketId)

  if (!market) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Predict with AI</h1>
          <p className="text-muted-foreground">
            Generate AI predictions for this market using multiple models
          </p>
        </div>

        {/* Market Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{market.question}</h2>
              <p className="text-sm text-muted-foreground">
                {market.event.title}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {market.outcomes.map((outcome, index) => (
                  <div
                    key={outcome}
                    className="px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    {outcome}: {(Number(market.outcomePrices[index]) * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generator Component */}
        <Suspense fallback={<GeneratorSkeleton />}>
          <PredictionGenerator marketId={marketId} />
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