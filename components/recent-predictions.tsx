import { format } from "date-fns"
import Link from "next/link"
import type { Prediction, Market, Event } from "@/lib/types"
import { EventIcon } from "@/components/event-icon"

type PredictionWithRelations = Prediction & { market: (Market & { event: Event | null }) | null }

// Minimal presentational component for a list of recent predictions with market and event context
export function RecentPredictions({ items }: { items: PredictionWithRelations[] }) {
  if (!items || items.length === 0) {
    return (
      <section aria-labelledby="recent-predictions-heading" className="mt-8">
        <h2 id="recent-predictions-heading" className="text-lg font-semibold mb-4">Recent AI Predictions</h2>
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
            <div key={p.id as any} className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-start sm:gap-4">
                {/* Event image - 1 column */}
                <div className="flex col-span-1 items-center justify-start pl-1 sm:col-span-1 sm:justify-center sm:pl-2">
                  <EventIcon image={eventImage} icon={eventIcon} title={eventTitle} size="sm" className="sm:w-10 sm:h-10" />
                </div>

                {/* Market question/title - 2 columns */}
                <div className="sm:col-span-2 min-w-0">
                  {marketId ? (
                    <Link href={`/market/${marketId}`} className="block hover:bg-muted/50 rounded-sm -m-1 p-1 transition-colors">
                      <div className="space-y-1">
                        <div className="font-small text-foreground line-clamp-3">
                          {marketQuestion}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market</div>
                      <div className="font-medium text-foreground line-clamp-1">
                        {marketQuestion}
                      </div>
                    </div>
                  )}
                </div>

                {/* Market Probability - 2 columns */}
                <div className="sm:col-span-2">
                  <Link href={`/market/${marketId}`} className="block hover:bg-muted/50 rounded-sm -m-1 p-1 transition-colors">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Market Probability</div>
                    <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
                      <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
                        <div className="text-muted-foreground">Yes</div>
                        <div className="text-right font-semibold tabular-nums">33%</div>
                      </div>
                      <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
                        <div className="text-muted-foreground">No</div>
                        <div className="text-right font-semibold tabular-nums">66%</div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* AI Probability (link to prediction detail) */}
                <div className="sm:col-span-2">
                  <Link href={`/prediction/${p.id as any}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Probability</div>
                    <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
                      <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
                        <div className="text-muted-foreground">Yes</div>
                        <div className="text-right font-semibold tabular-nums">22%</div>
                      </div>
                      <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
                        <div className="text-muted-foreground">No</div>
                        <div className="text-right font-semibold tabular-nums">78%</div>
                      </div>
                    </div>
                  </Link>
                </div>
                
                {/* Difference/Delta */}
                
                <div className="sm:col-span-2">
                  <Link href={`/prediction/${p.id as any}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
                  
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">
                      Difference
                    </div>
                  <div className="mt-1 text-sm font-semibold text-right">
                    25%
                  </div>
                  </Link>
                </div>
                  
                 

                {/* Reasoning + Timestamp -  (link to prediction detail) */}
                <div className="sm:col-span-2 min-w-0">
                  <Link href={`/prediction/${p.id as any}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Reasoning</div>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {reasoning || '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 sm:text-right">
                        Generated: {createdAtDisplay}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}



