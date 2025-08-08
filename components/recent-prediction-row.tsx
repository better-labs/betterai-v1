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
  reasoning?: string | null
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
    reasoning,
    createdAtDisplay,
  } = props

  return (
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-start sm:gap-4">
        {/* Event image - 1 column */}
        <div className="flex col-span-1 items-center justify-start pl-1 sm:col-span-1 sm:justify-center sm:pl-2">
          <EventIcon image={eventImage ?? null} icon={eventIcon ?? null} title={eventTitle} size="sm" className="sm:w-10 sm:h-10" />
        </div>

                 {/* Combined Event + Market section - 2 columns */}
         <div className="sm:col-span-2 min-w-0">
           {marketId ? (
             <Link href={`/market/${marketId}`} className="block hover:bg-muted/50 rounded-sm -m-1 p-1 transition-colors">
               <div className="space-y-1">
                 <div className="flex items-baseline gap-2 min-w-0">
                   <div className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">Event</div>
                   <div className="text-xs text-muted-foreground truncate">{eventTitle || '—'}</div>
                 </div>
                 <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Market</div>
                 <div className="font-medium text-foreground line-clamp-1">
                   {marketQuestion}
                 </div>
               </div>
             </Link>
           ) : (
             <div className="space-y-1">
               <div className="flex items-baseline gap-2 min-w-0">
                 <div className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">Event</div>
                 <div className="text-xs text-muted-foreground truncate">{eventTitle || '—'}</div>
               </div>
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
           <Link href={`/prediction/${props.id}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
             <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-right">AI Probability</div>
             <div className="text-2xl font-semibold tabular-nums sm:text-right">{aiProbability}%</div>
           </Link>
         </div>

         {/* Reasoning + Timestamp - 5 columns (link to prediction detail) */}
         <div className="sm:col-span-5 min-w-0">
           <Link href={`/prediction/${props.id}`} className="block rounded-sm p-0.5 hover:bg-muted/50 transition-colors">
             <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Reasoning</div>
             <div className="flex flex-col gap-1">
               <div className="text-sm text-muted-foreground line-clamp-2">
                 {reasoning || '—'}
               </div>
               <div className="text-[10px] text-muted-foreground/60 sm:text-right">
                 {createdAtDisplay}
               </div>
             </div>
           </Link>
         </div>
      </div>
    </div>
  )
}


