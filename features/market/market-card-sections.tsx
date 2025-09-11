import Link from 'next/link'
import { useState } from 'react'
import { Brain } from 'lucide-react'
import { Button } from "@/shared/ui/button"
import { Stat } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import { ViewAllLink } from "@/shared/ui/view-all-link"
import { StatsDisplaySection, SingleStatDisplaySection } from '@/shared/ui/stats-display-section.client'
import { components, spacing, typography } from '@/lib/design-system'
import { formatPercent } from '@/lib/utils'
import { isMarketOpenForBetting } from '@/lib/utils/market-status'
import { computeDeltaFromArrays, DELTA_TOOLTIP, getDeltaTone } from '@/lib/delta'
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MarketHeaderProps {
  market: Market
  event?: Event | null
  href?: string | null
  showActiveStatus?: boolean
}

export interface MarketProbabilityProps {
  market: Market
  latestPrediction?: Prediction | null
  showProgressBar?: boolean
}

export interface AIDeltaProps {
  market: Market
  latestPrediction: Prediction
}

export interface MarketCTAProps {
  market: Market
  event?: Event | null
  externalMarketUrl?: string | null
  onGeneratePrediction: () => void
}

export interface MarketMetaProps {
  market: Market
  event?: Event | null
  latestPrediction?: Prediction | null
}

export interface AIPredictionStatsProps {
  latestPrediction: Prediction
  showProgressBar?: boolean
}

export interface PredictionReasoningProps {
  latestPrediction: Prediction
}

// ============================================================================
// MARKET HEADER COMPONENT
// ============================================================================

export function MarketHeader({ market, event, href, showActiveStatus = false }: MarketHeaderProps) {
  const content = (
    <div className="relative">
      
      
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
        <p className="text-lg font-medium leading-tight whitespace-pre-wrap break-words">
          {market.question}
        </p>
      </div>

      {/* Market Status Badge - Top Right */}
      {showActiveStatus && (
          <span className={components.cardFooter.metadataBadge}>
            {isMarketOpenForBetting(market) ? 'Open' : 'Closed'}
          </span>
        
      )}
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

export function MarketProbability({ market, latestPrediction, showProgressBar = true }: MarketProbabilityProps) {
  const marketStats = (market.outcomes || []).map((outcome, index) => ({
    label: outcome,
    value: market.outcomePrices?.[index] || null
  }))

  return (
    // Market metrics stats
  
      <div  data-debug-id="market-probability">
        <Link href={`/market/${market.id}`} className="block hover:opacity-80 transition-opacity">
          <StatsDisplaySection
            title="Market Probability"
            stats={marketStats}
            showProgressBars={showProgressBar}
          />
        </Link>
      </div>
        
    
    
  )
}

// ============================================================================
// AI PREDICTION STATS COMPONENT
// ============================================================================

export function AIPredictionStats({ latestPrediction, showProgressBar = true }: AIPredictionStatsProps) {
  const predictionStats = latestPrediction.outcomes?.map((outcome, index) => ({
    label: outcome,
    value: latestPrediction.outcomesProbabilities?.[index] || null
  })) || []

  return (
    <div className={components.metrics.stat}>
      <Link href={`/prediction/${latestPrediction.id}`} className="block hover:opacity-80 transition-opacity">
        <StatsDisplaySection
          title="AI Prediction"
          stats={predictionStats}
          showProgressBars={showProgressBar}
        />
      </Link>
    </div>
  )
}

// ============================================================================
// PREDICTION REASONING COMPONENT  
// ============================================================================

export function PredictionReasoning({ latestPrediction }: PredictionReasoningProps) {
  if (!latestPrediction?.predictionResult?.reasoning) {
    return null
  }

  return (
    <div className={components.metrics.stat}>
      <ExpandableReasoning reasoning={latestPrediction.predictionResult.reasoning} />
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

export function AIDelta({ market, latestPrediction }: AIDeltaProps) {
  const delta = computeDeltaFromArrays(market.outcomePrices ?? null, latestPrediction.outcomesProbabilities ?? null)

  return (
    <Link 
      href={`/prediction/${latestPrediction.id}`}
      className={` hover:opacity-80 transition-opacity ${components.interactive.focus}`}
    >
      {/* <div className={components.metrics.stat}>
        <Stat
          label="AI Delta"
          value={delta != null ? formatPercent(delta) : '—'}
          tooltip={DELTA_TOOLTIP}
          tone={getDeltaTone(delta)}
          density="compact"
          align="left"
        />
      </div> */}
      <SingleStatDisplaySection
        title="AI Delta"
        label="Delta"
        value={delta}
      />
      
     
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
  onGeneratePrediction
}: MarketCTAProps) {
  if (!isMarketOpenForBetting(market)) return null

  return (
    <div className={`${spacing.cta} space-y-3`}>
      <Button
        onClick={onGeneratePrediction}
        variant="primary"
        size="md"
        className="w-full"
        data-debug-id="generate-prediction-btn"
        aria-label="Generate AI prediction"
      >
        <Brain className="h-4 w-4" />
        Predict with AI
      </Button>
      
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
      
    </div>
  )
}