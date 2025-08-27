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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
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

  const handleShowMore = async () => {
    setIsLoadingMore(true)
    const oldLimit = marketLimit
    const newLimit = oldLimit + 10
    
    console.log(`Loading more markets: ${oldLimit} → ${newLimit}`)
    setMarketLimit(newLimit)
    
    // Wait for the new data to be loaded
    try {
      await refetchMarkets()
      console.log(`Markets loaded: ${marketsData?.items?.length || 0}, hasMore: ${marketsData?.hasMore}`)
    } finally {
      setIsLoadingMore(false)
    }
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
        <p className="text-muted-foreground ">
          Markets with the highest dailytrading volume
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
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Show More Button */}
      {!marketsLoading && marketsData?.hasMore && (
        <div className="text-center">
          <button
            onClick={handleShowMore}
            disabled={marketsLoading || isLoadingMore}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            aria-label="Load more trending markets"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span className="font-medium">Loading More...</span>
              </>
            ) : (
              <>
                <span className="font-medium">Show More Markets</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </>
            )}
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