"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import { Button } from "@/shared/ui/button"
import { Stat } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import { ViewAllLink } from "@/shared/ui/view-all-link"
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'
import { formatPercent } from '@/lib/utils'
import { computeDeltaFromArrays, DELTA_TOOLTIP, getDeltaTone } from '@/lib/delta'

import { Brain } from 'lucide-react'
import { components } from '@/lib/design-system'
import { OutcomeStat } from '@/shared/ui/outcome-stat'

interface MarketDetailsCardProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  className?: string
  latestPrediction?: Prediction | null
  href?: string | null
  hidePredictionButton?: boolean
  hideReasoning?: boolean
}

export default function MarketDetailsCard({
  market,
  event,
  externalMarketUrl,
  className,
  latestPrediction,
  href = null,
  hidePredictionButton = false,
  hideReasoning = false,
}: MarketDetailsCardProps) {
  const lastUpdatedLabel = `Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : 'Unknown'}`


  const delta = latestPrediction
    ? computeDeltaFromArrays(market.outcomePrices ?? null, latestPrediction.outcomesProbabilities ?? null)
    : null

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
    <Card className={className} data-debug-id="market-card">
      <CardHeader className="pb-3">
        {/* Event Icon and Title */}
        <Link 
          href={`/market/${market.id}`}
          className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity"
        >
          {event && (
            <EventIcon
              image={event.image}
              icon={event.icon}
              title={event.title}
              size="twoxl"
              className="flex-shrink-0"
            />
          )}
          <CardTitle className="text-base leading-tight">
          {market.question}
        </CardTitle>  
        </Link>
        
        
      </CardHeader>
      
      <CardContent className={`space-y-6 ${components.interactive.interactiveZone}`}>
        {/* Market Probability Stats */}
        <div className="flex items-start gap-4">
          <div className={latestPrediction ? "flex-1" : "w-full max-w-md"}>
            <OutcomeStat
              label="Market Probability"
              outcomes={market.outcomes || []}
              values={market.outcomePrices as number[] || []}
              tooltip={lastUpdatedLabel}
              href={`/market/${market.id}`}
            />
          </div>
            
          {/* AI Prediction Stats - only show if prediction exists */}
          {latestPrediction && (
            <OutcomeStat
              label="AI Prediction"
              outcomes={latestPrediction.outcomes || []}
              values={latestPrediction.outcomesProbabilities || []}
              tooltip={latestPrediction.createdAt 
                ? `Last generated: ${new Date(latestPrediction.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : 'No AI prediction yet'
              }
              href={`/prediction/${latestPrediction.id}`}
              className="flex-1"
            />
          )}
        </div>

        {/* AI Delta - only show if prediction exists */}
        {latestPrediction && (
          <Link 
            href={`/prediction/${latestPrediction.id}`}
            className="flex items-start gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="flex-shrink-0">
              <Stat
                label="AI Delta"
                value={delta != null ? formatPercent(delta) : '—'}
                tooltip={DELTA_TOOLTIP}
                tone={getDeltaTone(delta)}
                density="compact"
                align="center"
              />
            </div>
            {latestPrediction?.predictionResult?.reasoning && !hideReasoning && (
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Reasoning</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {latestPrediction.predictionResult.reasoning.length > 120 
                    ? `${latestPrediction.predictionResult.reasoning.slice(0, 120)}...`
                    : latestPrediction.predictionResult.reasoning
                  }
                </p>
              </div>
            )}
          </Link>
        )}

        {/* Generate New AI Prediction Button */}
        {!hidePredictionButton && (
          <div className="pt-2 space-y-3">
            <Button
              onClick={handleGeneratePrediction}
              variant="primary"
              size="md"
              className="w-full"
              data-debug-id="generate-prediction-btn"
            >
              <Brain className="h-4 w-4" />
              Predict with AI
            </Button>
            
            {/* External Market Link */}
            {externalMarketUrl && (
              <div className="text-center">
                <ViewAllLink
                  href={externalMarketUrl}
                  variant="base"
                  external={true}
                  className="text-sm"
                  data-debug-id="market-external-link"
                >
                  Open Market on {event?.marketProvider ?? 'Polymarket'}
                </ViewAllLink>
              </div>
            )}
          </div>
        )}

        {/* Footer Metadata */}
        <div className={components.cardFooter.container}>
          {/* Date metadata row */}
          <div className={`${components.cardFooter.item} ${components.cardFooter.layout.split} mb-2`}>
            <span className={components.cardFooter.timestamp}>
              Market updated: {event?.updatedAt ? new Date(event.updatedAt).toLocaleDateString() : 'Unknown'}
            </span>
            {latestPrediction && (
              <span className={components.cardFooter.timestamp}>
                Prediction updated: {new Date(latestPrediction.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {/* Prediction metadata row */}
          {latestPrediction && (
            <div className={`${components.cardFooter.item} ${components.cardFooter.layout.split} mb-2`}>
            {event?.endDate && (
              <span className={components.cardFooter.timestamp}>
                Ends: {new Date(event.endDate).toLocaleDateString()}
              </span>
            )}  
              {latestPrediction.modelName && (
                <span className={components.cardFooter.timestamp}>
                  AI Model: {latestPrediction.modelName}
                </span>
              )}
            </div>
          )}
        </div>
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


