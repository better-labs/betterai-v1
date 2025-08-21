"use client"

import { format } from "date-fns"
import Link from "next/link"
import type { Prediction, Market, Event, Tag } from "@/lib/types"
import { EventIcon } from "@/components/event-icon"
import { PredictionProbabilityGrid } from "@/components/prediction-probability-grid"
import { PopularTagsList } from "@/components/popular-tags-list"
import { TrendingSelector, type SortMode } from "@/components/trending-selector"
import { useApiQuery } from "@/lib/client/api-handler"

type PredictionWithRelations = Prediction & { market: (Market & { event: Event | null }) | null }

interface RecentPredictionsProps {
  items: PredictionWithRelations[]
  selectedTagIds?: string[]
  onTagSelect?: (tagId: string) => void
  onClearFilters?: () => void
  isFiltered?: boolean
  sortMode?: SortMode
  onSortModeChange?: (mode: SortMode) => void
}

// Minimal presentational component for a list of recent predictions with market and event context
export function RecentPredictions({ 
  items, 
  selectedTagIds = [], 
  onTagSelect, 
  onClearFilters, 
  isFiltered = false,
  sortMode = "markets",
  onSortModeChange
}: RecentPredictionsProps) {
  // Fetch popular tags using TanStack Query
  const { 
    data: popularTagsResponse, 
    isLoading: tagsLoading 
  } = useApiQuery<{ success: boolean; data: (Tag & { totalVolume: number })[] }>(
    ['popular-tags'],
    '/api/tags/popular?limit=25',
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }
  )
  
  const popularTags = popularTagsResponse?.success ? popularTagsResponse.data : []

  if (!items || items.length === 0) {
    return (
      <section className="mt-2">
        {onSortModeChange && (
          <TrendingSelector 
            value={sortMode}
            onValueChange={onSortModeChange}
          />
        )}
        {!tagsLoading && popularTags.length > 0 && (
          <PopularTagsList 
            tags={popularTags} 
            selectedTagIds={selectedTagIds}
            onTagSelect={onTagSelect}
            onClearFilters={onClearFilters}
            isFiltered={isFiltered}
          />
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
    <section className="mt-2">
      {onSortModeChange && (
        <TrendingSelector 
          value={sortMode}
          onValueChange={onSortModeChange}
        />
      )}
      {!tagsLoading && popularTags.length > 0 && (
        <PopularTagsList 
          tags={popularTags} 
          selectedTagIds={selectedTagIds}
          onTagSelect={onTagSelect}
          onClearFilters={onClearFilters}
          isFiltered={isFiltered}
        />
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
              className="block p-2 sm:p-3 hover:bg-muted/50 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
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



