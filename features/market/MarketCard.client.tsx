"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Stat, StatGroup } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'
import { formatPercent, toUnitProbability } from '@/lib/utils'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { Brain } from 'lucide-react'
import { components } from '@/lib/design-system'

interface MarketDetailsCardProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  className?: string
  latestPrediction?: Prediction | null
  href?: string | null
}

export default function MarketDetailsCard({
  market,
  event,
  externalMarketUrl,
  className,
  latestPrediction,
  href = null,
}: MarketDetailsCardProps) {
  const lastUpdatedLabel = `Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : 'Unknown'}`

  const lastGeneratedLabel = latestPrediction?.createdAt 
    ? `Last generated: ${new Date(latestPrediction.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : 'No AI prediction yet'

  // Calculate AI Delta (absolute difference between first outcomes)
  const calculateDelta = () => {
    if (!latestPrediction || !market.outcomePrices?.[0] || !latestPrediction.outcomesProbabilities?.[0]) {
      return null
    }
    const marketProb = toUnitProbability(market.outcomePrices[0])
    const aiProb = toUnitProbability(latestPrediction.outcomesProbabilities[0])
    if (marketProb == null || aiProb == null) return null
    return Math.abs(marketProb - aiProb)
  }

  const delta = calculateDelta()

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
          <div className="flex-1">
            <Link 
              href={`/market/${market.id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Stat
                        label="Market Probability"
                        value={
                          <div className="space-y-1">
                            {market.outcomes?.map((outcome, i) => (
                              <div key={i} className="flex items-center justify-between text-sm border border-border rounded px-3 py-2">
                                <span className="truncate pr-4">{outcome}</span>
                                <span className="font-semibold tabular-nums">
                                  {formatPercent(market.outcomePrices?.[i])}
                                </span>
                              </div>
                            ))}
                          </div>
                        }
                        density="compact"
                        align="left"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{lastUpdatedLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Link>
          </div>
            
          {/* AI Prediction Stats */}
          <div className="flex-1">
            {latestPrediction ? (
              <Link 
                href={`/prediction/${latestPrediction.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Stat
                          label="AI Prediction"
                          value={
                            <div className="space-y-1">
                              {latestPrediction.outcomes?.map((outcome, i) => (
                                <div key={i} className="flex items-center justify-between text-sm border border-border rounded px-3 py-2">
                                  <span className="truncate pr-4">{outcome}</span>
                                  <span className="font-semibold tabular-nums">
                                    {formatPercent(latestPrediction.outcomesProbabilities?.[i])}
                                  </span>
                                </div>
                              ))}
                            </div>
                          }
                          density="compact"
                          align="left"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lastGeneratedLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Stat
                        label="AI Prediction"
                        value={
                          <div className="text-sm text-muted-foreground py-2">
                            No prediction yet
                          </div>
                        }
                        density="compact"
                        align="left"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{lastGeneratedLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* AI Delta */}
        {latestPrediction ? (
          <Link 
            href={`/prediction/${latestPrediction.id}`}
            className="flex items-start gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="flex-shrink-0">
              <Stat
                label="AI Delta"
                value={delta != null ? formatPercent(delta) : '—'}
                tooltip="Absolute difference between market and AI probabilities"
                tone={delta && delta >= 0.10 ? 'positive' : delta && delta >= 0.05 ? 'caution' : 'neutral'}
                density="compact"
                align="center"
              />
            </div>
            {latestPrediction?.predictionResult?.reasoning && (
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
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Stat
                label="AI Delta"
                value="—"
                tooltip="Absolute difference between market and AI probabilities"
                tone="neutral"
                density="compact"
                align="center"
              />
            </div>
          </div>
        )}

        {/* Generate New AI Prediction Button */}
        <div className="pt-2">
          <Button 
            onClick={handleGeneratePrediction}
            className="w-full flex items-center gap-2"
            data-debug-id="generate-prediction-btn"
          >
            <Brain className="h-4 w-4" />
            Predict with AI
          </Button>
        </div>

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
          
          {/* External link */}
          {externalMarketUrl && (
            <div className={`${components.cardFooter.item} ${components.cardFooter.layout.single}`}>
              <a
                className={components.cardFooter.link}
                href={externalMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-debug-id="market-external-link"
              >
                Open Market on {event?.marketProvider ?? 'provider'}
              </a>
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
        className={`${components.interactive.nonInteractiveOverlay} ${components.interactive.cardLink.fullOverlay}`}
      />
    </div>
  ) : (
    card
  )
}


