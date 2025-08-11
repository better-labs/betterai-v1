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

          const toNum = (v: any): number | null => {
            if (v === null || v === undefined) return null
            if (typeof v === 'number') return v
            if (typeof v === 'string') {
              const n = parseFloat(v)
              return isFinite(n) ? n : null
            }
            if (typeof (v as any)?.toNumber === 'function') {
              try { return (v as any).toNumber() } catch { return null }
            }
            try { const n = Number(v as any); return isFinite(n) ? n : null } catch { return null }
          }

          // AI probability from stored arrays or aiResponse fallback
          let aiProbability = 0
          const arr0 = Array.isArray((p as any).outcomesProbabilities) ? (p as any).outcomesProbabilities[0] : null
          const arr0Num = toNum(arr0)
          if (arr0Num !== null) aiProbability = Math.round(arr0Num * 100)
          else if (p.aiResponse) {
            try {
              const parsed = JSON.parse(p.aiResponse as unknown as string)
              const arr = (parsed as any)?.outcomesProbabilities
              const first = Array.isArray(arr) ? toNum(arr[0]) : null
              if (first !== null) aiProbability = Math.round(first * 100)
            } catch {}
          }

          // Market probability from outcomePrices[0]
          let marketProbability: number | null = null
          const op: any = (market as any)?.outcomePrices
          let firstPrice: any = null
          if (Array.isArray(op)) firstPrice = op[0]
          else if (typeof op === 'string') {
            try { const arr = JSON.parse(op); if (Array.isArray(arr)) firstPrice = arr[0] } catch {}
          }
          const firstPriceNum = toNum(firstPrice)
          if (firstPriceNum !== null) marketProbability = Math.round(firstPriceNum * 100)

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

                {/* Combined Event + Market section - 2 columns */}
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
                  {marketId ? (
                    <Link href={`/market/${marketId}`} className="block hover:bg-muted/50 rounded-sm -m-1 p-1 transition-colors">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Market Probability</div>
                      <div className="text-2xl font-semibold tabular-nums sm:text-right">{marketProbability !== null ? `${marketProbability}%` : '--'}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Market Probability</div>
                      <div className="text-2xl font-semibold tabular-nums sm:text-right">{marketProbability !== null ? `${marketProbability}%` : '--'}</div>
                    </>
                  )}
                </div>

                {/* AI Probability - 2 columns (link to prediction detail) */}
                <div className="sm:col-span-2">
                  <Link href={`/prediction/${p.id as any}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Probability</div>
                    <div className="text-2xl font-semibold tabular-nums sm:text-right">{aiProbability}%</div>
                  </Link>
                </div>

                {/* Reasoning + Timestamp -  (link to prediction detail) */}
                <div className="sm:col-span-4 min-w-0">
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



