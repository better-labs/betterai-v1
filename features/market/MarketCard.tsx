import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Stat, StatGroup } from "@/shared/ui/stat"
import { EventIcon } from "@/shared/ui/event-icon"
import type { EventDTO as Event, MarketDTO as Market, PredictionDTO as Prediction } from '@/lib/types'
import { formatPercent, toUnitProbability } from '@/lib/utils'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"

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

  const handleGeneratePrediction = () => {
    // TODO: Implement prediction generation
    alert('Coming soon!')
  }

  const card = (
    <Card className={className} data-debug-id="market-card">
      <CardHeader className="pb-4">
        {/* Event Icon and Title */}
        <div className="flex items-center gap-3 mb-2">
          {event && (
            <EventIcon
              image={event.image}
              icon={event.icon}
              title={event.title}
              size="md"
              className="flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-muted-foreground truncate">
              {event?.title ?? 'Event'}
            </h3>
          </div>
        </div>
        
        {/* Market Question */}
        <CardTitle className="text-base leading-tight mb-3">
          {market.question}
          <Badge variant={market.active ? 'default' : 'secondary'} className="ml-2">
            {market.active ? 'Active' : 'Closed'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Market Probability Stats */}
        <div>
          <StatGroup className="grid-cols-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Stat
                      label="Market Probability"
                      value={
                        <div className="space-y-1">
                          {market.outcomes?.map((outcome, i) => (
                            <div key={i} className="flex justify-between text-sm border border-border rounded px-2 py-1">
                              <span className="truncate">{outcome}</span>
                              <span className="font-semibold tabular-nums ml-2">
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
            
            {/* AI Prediction Stats */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Stat
                      label="AI Prediction"
                      value={
                        latestPrediction ? (
                          <div className="space-y-1">
                            {latestPrediction.outcomes?.map((outcome, i) => (
                              <div key={i} className="flex justify-between text-sm border border-border rounded px-2 py-1">
                                <span className="truncate">{outcome}</span>
                                <span className="font-semibold tabular-nums ml-2">
                                  {formatPercent(latestPrediction.outcomesProbabilities?.[i])}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">
                            No prediction yet
                          </div>
                        )
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
          </StatGroup>
        </div>

        {/* AI Delta */}
        <div>
          <Stat
            label="AI Delta"
            value={delta != null ? formatPercent(delta) : '—'}
            helpText="Absolute difference between market and AI probabilities"
            tone={delta && delta >= 0.10 ? 'positive' : delta && delta >= 0.05 ? 'caution' : 'neutral'}
            density="compact"
            align="center"
          />
        </div>

        {/* Generate New AI Prediction Button */}
        <div className="pt-2">
          <Button 
            onClick={handleGeneratePrediction}
            className="w-full"
            variant="outline"
            data-debug-id="generate-prediction-btn"
          >
            Generate New AI Prediction
          </Button>
        </div>

        {/* External Provider Link */}
        {externalMarketUrl && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              <a
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                href={externalMarketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Market on {event?.marketProvider ?? 'provider'}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Make the entire card clickable when href is provided without nesting anchors
  return href ? (
    <div className="relative group">
      <div className="transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:shadow-muted/20 group-hover:-translate-y-0.5">
        {card}
      </div>
      <Link
        href={href}
        aria-label={`View market: ${market.question}`}
        className="absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
      />
    </div>
  ) : (
    card
  )
}


