import Link from "next/link"
import { format } from "date-fns"
import type { Prediction, Market, Event } from "@/lib/types"

type PredictionWithRelations = Prediction & { market: (Market & { event: Event | null }) | null }

// Minimal presentational component for a list of recent predictions with market and event context
export function RecentPredictions({ items }: { items: PredictionWithRelations[] }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="recent-predictions-heading" className="mt-8">
      <h2 id="recent-predictions-heading" className="text-lg font-semibold mb-4">Recent AI Predictions</h2>
      <div className="divide-y rounded-lg border bg-card">
        {items.map((p) => {
          const market = p.market
          const event = market?.event || null
          const probability = typeof p.probability === 'object' && p.probability !== null
            ? Number(p.probability as unknown as number)
            : Number(p.probability ?? 0)
          const displayProbability = isFinite(probability) ? Math.round(probability * 100) : 0
          const created = p.createdAt ? new Date(p.createdAt) : null

          return (
            <div key={p.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Event</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {event?.title ? (
                        <Link href={`/event/${event.id}`} className="hover:underline">
                          {event.title}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market</div>
                    <div className="font-medium text-foreground truncate">
                      {market ? (
                        <Link href={`/market/${market.id}`} className="hover:underline">
                          {market.question}
                        </Link>
                      ) : (
                        p.userMessage
                      )}
                    </div>
                  </div>

                  {p.aiResponse && (
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {(() => {
                        try {
                          const parsed = JSON.parse(p.aiResponse)
                          if (parsed && typeof parsed === 'object' && 'prediction' in parsed) {
                            return String((parsed as any).prediction)
                          }
                        } catch {}
                        return p.userMessage
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                  <div className="text-2xl font-semibold tabular-nums">{displayProbability}%</div>
                  <div className="text-xs text-muted-foreground">
                    {created ? format(created, 'PP p') : ''}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}


