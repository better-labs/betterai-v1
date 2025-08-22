"use client"

import { format } from "date-fns"
import Link from "next/link"
import { motion } from "framer-motion"
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
        {/* Combined selector and filter bar row */}
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-6 sm:mb-4">
          {onSortModeChange && (
            <TrendingSelector 
              value={sortMode}
              onValueChange={onSortModeChange}
              className="flex-shrink-0"
            />
          )}
          {!tagsLoading && popularTags.length > 0 && (
            <div className="flex-1 min-w-0">
              <PopularTagsList 
                tags={popularTags} 
                selectedTagIds={selectedTagIds}
                onTagSelect={onTagSelect}
                onClearFilters={onClearFilters}
                isFiltered={isFiltered}
              />
            </div>
          )}
        </div>

        {/* Mobile - show components stacked */}
        <div className="sm:hidden">
          {onSortModeChange && (
            <TrendingSelector 
              value={sortMode}
              onValueChange={onSortModeChange}
            />
          )}
        </div>

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
      {/* Combined selector and filter bar row */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-6 sm:mb-4">
        {onSortModeChange && (
          <TrendingSelector 
            value={sortMode}
            onValueChange={onSortModeChange}
            className="flex-shrink-0"
          />
        )}
        {!tagsLoading && popularTags.length > 0 && (
          <div className="flex-1 min-w-0">
            <PopularTagsList 
              tags={popularTags} 
              selectedTagIds={selectedTagIds}
              onTagSelect={onTagSelect}
              onClearFilters={onClearFilters}
              isFiltered={isFiltered}
            />
          </div>
        )}
      </div>

      {/* Mobile - show components stacked */}
      <div className="sm:hidden">
        {onSortModeChange && (
          <TrendingSelector 
            value={sortMode}
            onValueChange={onSortModeChange}
          />
        )}
      </div>
      <motion.div 
        className="divide-y rounded-lg border bg-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {items.map((p, index) => {
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
            <motion.div
              key={p.id as any}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -2,
                transition: { duration: 0.15 }
              }}
            >
              <Link
                href={`/prediction/${p.id as any}`}
                className="block p-2 sm:p-3 hover:bg-muted/30 hover:shadow-lg hover:shadow-muted/20 rounded-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring border-b border-border/50 hover:border-transparent"
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
                <div className="sm:col-span-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Reasoning</div>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-muted-foreground/80 line-clamp-2">
                      {reasoning || '—'}
                    </div>
                    <div className="text-[9px] text-muted-foreground/50 sm:text-right">
                      Generated: {createdAtDisplay}
                    </div>
                  </div>
                </div>
              </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}



