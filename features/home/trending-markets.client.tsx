"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, TrendingUp } from "lucide-react"
import type { Tag } from "@/lib/types"
import type { AppRouter } from "@/lib/trpc/routers/_app"
import type { inferProcedureOutput } from "@trpc/server"
import { trpc } from "@/shared/providers/trpc-provider"
import { PopularTagsList } from "@/shared/ui/popular-tags-list"
import { LoadingCard } from "@/shared/ui/loading"
import MarketDetailsCard from "@/features/market/MarketCard.client"
import { useApiQuery } from "@/lib/client/api-handler"
import { typography } from "@/lib/design-system"

// Use tRPC's inferred types
type TrendingMarketsResponse = inferProcedureOutput<AppRouter['markets']['trending']>
type MarketItem = TrendingMarketsResponse['items'][number]

export function TrendingMarkets() {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [marketLimit, setMarketLimit] = useState(10)
  
  // Fetch trending markets using tRPC
  const {
    data: marketsData,
    isLoading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
  } = trpc.markets.trending.useQuery({
    limit: marketLimit,
    withPredictions: true,
  })

  // Fetch popular tags using existing API
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
  const markets = marketsData?.items || []

  const handleTagSelect = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleClearFilters = () => {
    setSelectedTagIds([])
  }

  const handleShowMore = () => {
    setMarketLimit(prev => prev + 10)
  }

  // Filter markets by selected tags if any tags are selected
  const filteredMarkets = selectedTagIds.length > 0
    ? markets.filter(market =>
        market.event?.tags?.some((tag: any) =>
          typeof tag === 'object' && tag.id
            ? selectedTagIds.includes(tag.id)
            : selectedTagIds.includes(String(tag))
        )
      )
    : markets

  if (marketsLoading && markets.length === 0) {
    return <LoadingCard />
  }

  if (marketsError) {
    return (
      <div className="border rounded-lg p-8 text-center bg-card">
        <p className="text-destructive">Error loading trending markets</p>
        <button 
          onClick={() => refetchMarkets()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`${typography.h2} flex items-center justify-center gap-2`}>
          <TrendingUp className="text-primary" />
          Trending Markets
        </h2>
        <p className="text-muted-foreground mt-2">
          Markets with the highest trading volume
        </p>
      </div>

      {/* Popular Tags Filter */}
      {/* todo: fix */}
      {/* {!tagsLoading && popularTags.length > 0 && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <PopularTagsList 
              tags={popularTags} 
              selectedTagIds={selectedTagIds}
              onTagSelect={handleTagSelect}
              onClearFilters={handleClearFilters}
              isFiltered={selectedTagIds.length > 0}
            />
          </div>
        </div>
      )} */}

      {/* Markets Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="border rounded-lg p-8 text-center bg-card">
          <p className="text-muted-foreground">
            {selectedTagIds.length > 0 
              ? "No markets found for selected tags"
              : "No trending markets available"
            }
          </p>
        </div>
      ) : (
        <motion.div 
          className="grid gap-6 md:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
            >
              <MarketDetailsCard
                market={market}
                event={market.event}
                latestPrediction={market.latestPrediction}
                href={`/market/${market.id}`}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Show More Button */}
      {!marketsLoading && markets.length > 0 && filteredMarkets.length === markets.length && (
        <div className="text-center">
          <button
            onClick={handleShowMore}
            disabled={marketsLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Load more trending markets"
          >
            <span>Show More Markets</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {marketsLoading && markets.length > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Loading more markets...
          </div>
        </div>
      )}
    </section>
  )
}