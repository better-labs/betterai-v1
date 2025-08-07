import Link from "next/link"
import { format } from "date-fns"
import type { Prediction, Market, Event } from "@/lib/types"
import { RecentPredictionRow } from "@/components/recent-prediction-row"

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

          const baseProb = toNum(p.probability) ?? 0
          let aiProbability = Math.round(baseProb * 100)

          if (p.aiResponse) {
            try {
              const parsed = JSON.parse(p.aiResponse as unknown as string)
              const probValue = (parsed as any)?.probability
              const parsedNum = toNum(probValue)
              if (parsedNum !== null) aiProbability = Math.round(parsedNum * 100)
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

          const createdAtDisplay = p.createdAt ? format(new Date(p.createdAt), 'PP p') : ''
          const marketQuestion = market ? market.question : p.userMessage

          return (
            <RecentPredictionRow
              key={p.id}
              id={p.id as any}
              eventTitle={event?.title ?? ''}
              eventIcon={event?.icon ?? null}
              eventImage={event?.image ?? null}
              marketId={market?.id ?? null}
              marketQuestion={marketQuestion}
              marketProbability={marketProbability}
              aiProbability={aiProbability}
              createdAtDisplay={createdAtDisplay}
            />
          )
        })}
      </div>
    </section>
  )
}



