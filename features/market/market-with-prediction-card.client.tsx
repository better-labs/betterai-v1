"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'

import { components, spacing } from '@/lib/design-system'
import { 
  MarketHeader, 
  MarketMetrics, 
  AIDelta, 
  MarketCTA, 
  MarketMeta 
} from './market-card-sections'

interface MarketWithPredictionCardProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  className?: string
  latestPrediction?: Prediction | null
  href?: string | null
  hidePredictionButton?: boolean
  hideReasoning?: boolean
}

export default function MarketWithPredictionCard({
  market,
  event,
  externalMarketUrl,
  className,
  latestPrediction,
  href = null,
  hidePredictionButton = false,
  hideReasoning = false,
}: MarketWithPredictionCardProps) {

  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { authenticated, login } = usePrivy()

  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get user credits to check if they can afford at least 1 credit (minimum for prediction)
  const { data: userCreditsResponse } = trpc.users.getCredits.useQuery(
    {},
    { enabled: authenticated && mounted }
  )

  const handleGeneratePrediction = () => {
    // Check authentication first
    if (!authenticated) {
      login()
      return
    }

    // Check if user has enough credits (at least 1)
    const credits = userCreditsResponse?.credits?.credits || 0
    if (credits < 1) {
      // Could show a modal or redirect to credits page, but for now just alert
      alert('You need at least 1 credit to generate predictions. Please purchase more credits.')
      return
    }

    // Route to predict page
    router.push(`/predict/${market.id}`)
  }

  const card = (
    <Card className={`${components.card.base} ${components.card.hover} ${spacing.card} ${className}`} data-debug-id="market-card">
      <CardHeader className="pb-2">
        <MarketHeader market={market} event={event} href={href} showActiveStatus={true} />
      </CardHeader>
      
      <CardContent className={`space-y-6 ${components.interactive.safeArea}`}>
        <MarketMetrics market={market} latestPrediction={latestPrediction} />
        
        {latestPrediction && (
          <AIDelta 
            market={market} 
            latestPrediction={latestPrediction} 
            hideReasoning={hideReasoning} 
          />
        )}
        
        <MarketCTA 
          market={market}
          event={event}
          externalMarketUrl={externalMarketUrl}
          onGeneratePrediction={handleGeneratePrediction}
          hidePredictionButton={hidePredictionButton}
        />
        
        <MarketMeta 
          market={market} 
          event={event} 
          latestPrediction={latestPrediction} 
        />
      </CardContent>
    </Card>
  )

  // Use pointer-events pattern to allow interactive elements while keeping card clickable
  return href ? (
    <div className={components.interactive.overlayContainer}>
      <div className="transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:shadow-muted/20 group-hover:-translate-y-0.5">
        {card}
      </div>
      <Link
        href={href}
        aria-label={`View market: ${market.question}`}
        className={`${components.interactive.nonInteractiveOverlay} ${components.interactive.fullOverlay}`}
      />
    </div>
  ) : (
    card
  )
}



