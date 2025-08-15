import { format } from "date-fns"
import Link from "next/link"
import type { Prediction, Market, Event } from "@/lib/types"
import { EventIcon } from "@/components/event-icon"
import { PredictionProbabilityGrid } from "@/components/prediction-probability-grid"

type PredictionWithRelations = Prediction & { market: (Market & { event: Event | null }) | null }

type PopularTag = { id: string; label: string }

// Using shared helpers from utils

// Minimal presentational component for a list of recent predictions with market and event context
export function RecentPredictions({ items, popularTags }: { items: PredictionWithRelations[], popularTags?: PopularTag[] }) {
  if (!items || items.length === 0) {
    return (
      <section aria-labelledby="recent-predictions-heading" className="mt-8">
        <h2 id="recent-predictions-heading" className="text-lg font-semibold mb-4">Recent AI Predictions</h2>
        {Array.isArray(popularTags) && popularTags.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {popularTags.slice(0, 10).map((t) => (
                <span key={t.id} className="whitespace-nowrap">{t.label}</span>
              ))}
            </div>
          </div>
        )}
        <div className="border rounded-lg p-8 text-center bg-card">
          <div className="space-y-2">
            <p className="text-muted-foreground">No predictions yet</p>
          </div>
        </div>
      </section>
    )
  }

  // If Predictions exist
  return (
    <section aria-labelledby="recent-predictions-heading" className="mt-8">
      <h2 id="recent-predictions-heading" className="text-lg font-semibold mb-4">Recent AI Predictions</h2>
      {Array.isArray(popularTags) && popularTags.length > 0 && (
        <div className="mb-3 overflow-x-auto">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {popularTags.slice(0, 10).map((t) => (
              <span key={t.id} className="whitespace-nowrap">{t.label}</span>
            ))}
          </div>
        </div>
      )}
      <div className="divide-y rounded-lg border bg-card">
        {items.map((p) => {
          const market = p.market
          const event = market?.event || null

          


          // Extract reasoning from aiResponse if available
          let reasoning: string | null = null
          if (p.aiResponse) {
            try {
              const parsed = JSON.parse(p.aiResponse as unknown as string)
              if (parsed && typeof parsed === 'object' && 'reasoning' in parsed) {
                reasoning = String(parsed.reasoning)
              }
            } catch {}
          }

          const createdAtDisplay = p.createdAt ? format(new Date(p.createdAt), 'PP p') : ''
          const marketQuestion = market ? market.question : p.userMessage
          const marketId = market?.id ?? null
          const eventTitle = event?.title ?? ''
          const eventIcon = event?.icon ?? null
          const eventImage = event?.image ?? null

          return (
            <Link
              key={p.id as any}
              href={`/prediction/${p.id as any}`}
              className="block p-4 sm:p-5 hover:bg-muted/50 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-start sm:gap-4">
                {/* Event image - 1 column */}
                <div className="flex col-span-1 items-center justify-start pl-1 sm:col-span-1 sm:justify-center sm:pl-2">
                  <EventIcon image={eventImage} icon={eventIcon} title={eventTitle} size="sm" className="sm:w-10 sm:h-10" />
                </div>

                {/* Market question/title - 2 columns */}
                <div className="sm:col-span-2 min-w-0">
                  {marketId ? (
                    <div className="space-y-1">
                      <div className="font-small text-foreground line-clamp-3">
                        {marketQuestion}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market</div>
                      <div className="font-medium text-foreground line-clamp-1">
                        {marketQuestion}
                      </div>
                    </div>
                  )}
                </div>

                {/* Probability Grid (Market, AI, Difference) - spans 6 columns */}
                <PredictionProbabilityGrid
                  className="sm:col-span-6"
                  marketOutcomes={market?.outcomes ?? null}
                  marketOutcomePrices={market?.outcomePrices ?? null}
                  aiOutcomes={p?.outcomes ?? null}
                  aiOutcomesProbabilities={p?.outcomesProbabilities ?? null}
                />
                  
                 

                {/* Reasoning + Timestamp -  (link to prediction detail) */}
                <div className="sm:col-span-2 min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Reasoning</div>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {reasoning || '—'}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 sm:text-right">
                      Generated: {createdAtDisplay}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}



