import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import { Button } from "@/shared/ui/button"
import { Stat } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import { ViewAllLink } from "@/shared/ui/view-all-link"
import { OutcomeStat } from '@/shared/ui/outcome-stat'
import { components, spacing, typography, layout } from '@/lib/design-system'
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

export interface MarketDeltaProps {
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
      <h3 className={`${typography.h3} ${spacing.heading} whitespace-pre-wrap break-words`}>
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
    <div className={`grid ${layout.grid.cols['2']} ${layout.grid.gap.md}`}>
      <div>
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
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldShowToggle = reasoning.length > 120

  if (!shouldShowToggle) {
    return (
      <div className="flex-1 min-w-0">
        <div className={typography.statLabel}>Reasoning</div>
        <p className={`${typography.bodySmall} text-muted-foreground leading-relaxed`}>
          {reasoning}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <div className={typography.statLabel}>Reasoning</div>
      <div className={components.motion.expandable.container}>
        <motion.div
          animate={{
            height: isExpanded ? 'auto' : components.motion.expandable.collapsedHeight
          }}
          transition={{
            duration: components.motion.expandable.animation.duration,
            ease: components.motion.expandable.animation.ease
          }}
          style={components.motion.expandable.textWrap}
        >
          <p className={`${typography.bodySmall} text-muted-foreground leading-relaxed`}>
            {reasoning}
          </p>
        </motion.div>
        
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              className={components.motion.fadeOverlay.container}
              initial={components.motion.fadeOverlay.animation.initial}
              animate={components.motion.fadeOverlay.animation.animate}
              exit={components.motion.fadeOverlay.animation.exit}
              transition={{ duration: components.motion.fadeOverlay.animation.duration }}
            />
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors ${components.interactive.focus}`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Show less reasoning' : 'Show more reasoning'}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
          <ChevronDown 
            className={`${components.disclosure.iconSm} ${components.disclosure.icon} ${
              isExpanded ? components.disclosure.expanded : components.disclosure.collapsed
            }`}
          />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MARKET DELTA COMPONENT
// ============================================================================

export function MarketDelta({ market, latestPrediction, hideReasoning = false }: MarketDeltaProps) {
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