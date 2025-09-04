import Link from 'next/link'
import { useState } from 'react'
import { Brain } from 'lucide-react'
import { Button } from "@/shared/ui/button"
import { Stat } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import { ViewAllLink } from "@/shared/ui/view-all-link"
import { OutcomeStat } from '@/shared/ui/outcome-stat'
import { components, spacing, typography } from '@/lib/design-system'
import { formatPercent } from '@/lib/utils'
import { computeDeltaFromArrays, DELTA_TOOLTIP, getDeltaTone } from '@/lib/delta'
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MarketHeaderProps {
  market: Market
  event?: Event | null
  href?: string | null
}

export interface MarketMetricsProps {
  market: Market
  latestPrediction?: Prediction | null
}

export interface AIDeltaProps {
  market: Market
  latestPrediction: Prediction
  hideReasoning?: boolean
}

export interface MarketCTAProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  onGeneratePrediction: () => void
  hidePredictionButton?: boolean
  isGeneratingPrediction?: boolean
}

export interface MarketMetaProps {
  market: Market
  event?: Event | null
  latestPrediction?: Prediction | null
}

// ============================================================================
// MARKET HEADER COMPONENT
// ============================================================================

export function MarketHeader({ market, event, href }: MarketHeaderProps) {
  const content = (
    <div className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
      {event && (
        <EventIcon
          image={event.image}
          icon={event.icon}
          title={event.title}
          size="twoxl"
          className="flex-shrink-0"
        />
      )}
      <h3 className={`${typography.h2} ${spacing.heading} whitespace-pre-wrap break-words`}>
        {market.question}
      </h3>
    </div>
  )

  const linkHref = href || `/market/${market.id}`
  
  return (
    <Link href={linkHref} className={components.interactive.focus}>
      {content}
    </Link>
  )
}

// ============================================================================
// MARKET METRICS COMPONENT
// ============================================================================

export function MarketMetrics({ market, latestPrediction }: MarketMetricsProps) {
  const lastUpdatedLabel = `Last updated: ${market.updatedAt ? new Date(market.updatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : 'Unknown'}`

  return (
    <div className={components.metrics.rowTwoCol}>
      <div className={components.metrics.stat}>
        <OutcomeStat
          label="Market Probability"
          outcomes={market.outcomes || []}
          values={market.outcomePrices as number[] || []}
          tooltip={lastUpdatedLabel}
          href={`/market/${market.id}`}
          size="md"
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
          size="md"
        />
      )}
    </div>
  )
}

// ============================================================================
// EXPANDABLE REASONING COMPONENT
// ============================================================================

interface ExpandableReasoningProps {
  reasoning: string
}

function ExpandableReasoning({ reasoning }: ExpandableReasoningProps) {
  const truncatedReasoning = reasoning.length > 200 
    ? `${reasoning.slice(0, 200)}...`
    : reasoning

  return (
    <div className="flex-1 min-w-0">
      <div className={typography.statLabel}>Reasoning</div>
      <p className={`${typography.bodySmall} text-muted-foreground leading-relaxed`}>
        {truncatedReasoning}
      </p>
    </div>
  )
}

// ============================================================================
// AI DELTA COMPONENT
// ============================================================================

export function AIDelta({ market, latestPrediction, hideReasoning = false }: AIDeltaProps) {
  const delta = computeDeltaFromArrays(market.outcomePrices ?? null, latestPrediction.outcomesProbabilities ?? null)

  return (
    <Link 
      href={`/prediction/${latestPrediction.id}`}
      className={`flex items-start gap-4 hover:opacity-80 transition-opacity ${components.interactive.focus}`}
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
        <ExpandableReasoning reasoning={latestPrediction.predictionResult.reasoning} />
      )}
    </Link>
  )
}

// ============================================================================
// MARKET CTA COMPONENT
// ============================================================================

export function MarketCTA({ 
  market, 
  event, 
  externalMarketUrl, 
  onGeneratePrediction, 
  hidePredictionButton = false,
  isGeneratingPrediction = false
}: MarketCTAProps) {
  if (hidePredictionButton) return null

  return (
    <div className={`${spacing.cta} space-y-3`}>
      <Button
        onClick={onGeneratePrediction}
        variant="primary"
        size="md"
        className="w-full"
        disabled={isGeneratingPrediction}
        data-debug-id="generate-prediction-btn"
        aria-label={isGeneratingPrediction ? 'Generating prediction...' : 'Generate AI prediction'}
      >
        {isGeneratingPrediction ? (
          <div className={components.loading.inline.content}>
            <div className={components.loading.inline.spinner} />
            Generating...
          </div>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            Predict with AI
          </>
        )}
      </Button>
      
      {/* External Market Link */}
      {externalMarketUrl && (
        <div className="text-center">
          <ViewAllLink
            href={externalMarketUrl}
            variant="base"
            external={true}
            className={`text-sm ${components.cardFooter.link}`}
            data-debug-id="market-external-link"
          >
            Open Market on {event?.marketProvider ?? 'Polymarket'}
          </ViewAllLink>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MARKET META COMPONENT
// ============================================================================

export function MarketMeta({ market, event, latestPrediction }: MarketMetaProps) {
  return (
    <div className={components.cardFooter.container}>
      {/* Date metadata row */}
      <div className={`${components.cardFooter.item} ${components.cardFooter.layout.split} mb-2`}>
        <span className={components.cardFooter.timestamp}>
          Market updated: {market.updatedAt ? new Date(market.updatedAt).toLocaleDateString() : 'Unknown'}
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
              Event Ends: {new Date(event.endDate).toLocaleDateString()}
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
  )
}