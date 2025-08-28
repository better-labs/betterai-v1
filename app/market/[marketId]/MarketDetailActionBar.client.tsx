"use client"

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { trpc } from '@/lib/trpc/client'
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { Coins, Brain } from 'lucide-react'

interface MarketDetailActionBarProps {
  marketId: string
}

export function MarketDetailActionBar({ marketId }: MarketDetailActionBarProps) {
  const router = useRouter()
  const { authenticated, login } = usePrivy()

  // Get user credits
  const { data: userCreditsResponse, isLoading: creditsLoading } = trpc.users.getCredits.useQuery(
    {},
    { enabled: authenticated }
  )

  // Check for recent sessions
  const { data: recentSessions } = trpc.predictionSessions.recentByMarket.useQuery(
    { marketId },
    { enabled: authenticated }
  )

  const credits = userCreditsResponse?.credits?.credits || 0
  const hasRecentSession = recentSessions && recentSessions.length > 0

  const handlePredictClick = () => {
    if (!authenticated) {
      login()
      return
    }

    if (credits < 1) {
      alert('You need at least 1 credit to generate predictions. Please purchase more credits.')
      return
    }

    router.push(`/predict/${marketId}`)
  }

  const handleViewLastRun = () => {
    if (hasRecentSession) {
      router.push(`/predict/${marketId}/${recentSessions[0].id}`)
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            {authenticated && (
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Credits:</span>
                <Badge variant="secondary">
                  {creditsLoading ? '...' : credits}
                </Badge>
              </div>
            )}

            {/* Recent Session Indicator */}
            {hasRecentSession && (
              <div className="text-sm text-muted-foreground">
                Recent prediction available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {hasRecentSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewLastRun}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                View Last Run
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handlePredictClick}
              disabled={authenticated && credits < 1}
              className="flex items-center gap-2"
              data-debug-id="market-detail-predict-button"
            >
              <Brain className="h-4 w-4" />
              Predict with AI
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        {!authenticated && (
          <p className="text-xs text-muted-foreground mt-3">
            Sign in to generate AI predictions for this market
          </p>
        )}

        {authenticated && credits < 1 && (
          <p className="text-xs text-muted-foreground mt-3">
            You need credits to generate predictions. Purchase credits to continue.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
