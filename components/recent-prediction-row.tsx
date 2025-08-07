"use client"
import Link from "next/link"
import { EventIcon } from "@/components/event-icon"

interface RecentPredictionRowProps {
  id: string | number
  eventTitle: string
  eventIcon?: string | null
  eventImage?: string | null
  marketId?: string | null
  marketQuestion: string
  marketProbability: number | null
  aiProbability: number
  createdAtDisplay: string
}

export function RecentPredictionRow(props: RecentPredictionRowProps) {
  const {
    eventTitle,
    eventIcon,
    eventImage,
    marketId,
    marketQuestion,
    marketProbability,
    aiProbability,
    createdAtDisplay,
  } = props

  return (
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-start sm:gap-4">
        {/* Event image - 1 column */}
        <div className="flex col-span-1 items-center justify-start pl-1 sm:col-span-1 sm:justify-center sm:pl-2">
          <EventIcon image={eventImage ?? null} icon={eventIcon ?? null} title={eventTitle} size="sm" className="sm:w-10 sm:h-10" />
        </div>

        {/* Event section - 2 columns */}
        <div className="sm:col-span-2 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">Event</div>
            <div className="text-xs text-muted-foreground truncate">{eventTitle || '—'}</div>
          </div>
        </div>

        {/* Market section - 2 columns */}
        <div className="sm:col-span-2 min-w-0">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market</div>
            <div className="font-medium text-foreground line-clamp-1">
              {marketId ? (
                <Link href={`/market/${marketId}`} className="hover:underline">
                  {marketQuestion}
                </Link>
              ) : (
                marketQuestion
              )}
            </div>
          </div>
        </div>

        {/* Market Probability - 2 columns */}
        <div className="sm:col-span-2 sm:text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market Probability</div>
          <div className="text-2xl font-semibold tabular-nums">{marketProbability !== null ? `${marketProbability}%` : '--'}</div>
        </div>

        {/* AI Probability - 2 columns */}
        <div className="sm:col-span-2 sm:text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">AI Probability</div>
          <div className="text-2xl font-semibold tabular-nums">{aiProbability}%</div>
        </div>

        {/* Timestamp - remaining columns */}
        <div className="sm:col-span-3">
          <div className="text-xs text-muted-foreground sm:text-right">{createdAtDisplay}</div>
        </div>
      </div>
    </div>
  )
}


