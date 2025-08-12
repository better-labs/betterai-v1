import { format } from "date-fns"
import Link from "next/link"
import type { Prediction, Market, Event } from "@/lib/types"
import { EventIcon } from "@/components/event-icon"

type PredictionWithRelations = Prediction & { market: (Market & { event: Event | null }) | null }

// Format a value as a percentage string, accepting 0..1 or 0..100 inputs
const formatPercent = (value: unknown): string => {
  if (value == null) return '—'
  let num: number | null = null
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value)
    num = Number.isFinite(parsed) ? parsed : null
  } else if (typeof value === 'object') {
    const anyVal = value as any
    if (typeof anyVal?.toNumber === 'function') {
      try { num = anyVal.toNumber() } catch { num = null }
    } else if (typeof anyVal?.toString === 'function') {
      const parsed = parseFloat(anyVal.toString())
      num = Number.isFinite(parsed) ? parsed : null
    }
  }
  if (num == null || !Number.isFinite(num)) return '—'
  const percent = num <= 1 ? num * 100 : num
  return `${Math.round(percent)}%`
}

// Normalize probabilities to 0..1 range from 0..1 or 0..100 inputs
const toUnitProbability = (value: unknown): number | null => {
  if (value == null) return null
  let num: number | null = null
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value)
    num = Number.isFinite(parsed) ? parsed : null
  } else if (typeof value === 'object') {
    const anyVal = value as any
    if (typeof anyVal?.toNumber === 'function') {
      try { num = anyVal.toNumber() } catch { num = null }
    } else if (typeof anyVal?.toString === 'function') {
      const parsed = parseFloat(anyVal.toString())
      num = Number.isFinite(parsed) ? parsed : null
    }
  }
  if (num == null || !Number.isFinite(num)) return null
  if (num > 1) return num / 100
  if (num >= 0) return num
  return null
}

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
          const marketOutcome0 = market?.outcomes?.[0] 
          const marketOutcome1 = market?.outcomes?.[1] 
          const price0 = market?.outcomePrices?.[0]
          const price1 = market?.outcomePrices?.[1]
          const aiProb0 = p?.outcomesProbabilities?.[0]
          const aiProb1 = p?.outcomesProbabilities?.[1]
          const aiOutcome0 = p?.outcomes?.[0] 
          const aiOutcome1 = p?.outcomes?.[1] 

           const difference0 = (() => {
             const marketP0 = toUnitProbability(price0)
             const aiP0 = toUnitProbability(aiProb0)
             if (marketP0 == null || aiP0 == null) return null
             return Math.abs(marketP0 - aiP0)
           })()

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

                {/* Market Probability - 2 columns */}
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">Market Probability</div>
                  <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
                    <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
                      <div className="text-muted-foreground">{marketOutcome0}</div>
                      <div className="text-right font-semibold tabular-nums">{formatPercent(price0)}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
                      <div className="text-muted-foreground">{marketOutcome1}</div>
                      <div className="text-right font-semibold tabular-nums">{formatPercent(price1)}</div>
                    </div>
                  </div>
                </div>

                {/* AI Probability (link to prediction detail) */}
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Probability</div>
                  <div className="mt-1 rounded-md border bg-muted/30 shadow-sm">
                    <div className="grid grid-cols-2 items-center px-2 py-1 text-sm">
                      <div className="text-muted-foreground">{aiOutcome0}</div>
                      <div className="text-right font-semibold tabular-nums">{formatPercent(aiProb0)}</div>
                    </div>
                    <div className="grid grid-cols-2 items-center px-2 py-1 text-sm border-t">
                      <div className="text-muted-foreground">{aiOutcome1}</div>
                      <div className="text-right font-semibold tabular-nums">{formatPercent(aiProb1)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Difference/Delta */}
                
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">
                    Difference
                  </div>
                  <div className="mt-1 text-xl  text-right">
                    {difference0 == null ? '—' : formatPercent(difference0)}
                  </div>
                </div>
                  
                 

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



