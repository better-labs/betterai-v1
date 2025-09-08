"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { ChevronDown, TrendingUp } from "lucide-react"
import { components } from "@/lib/design-system"
import type { AppRouter } from "@/lib/trpc/routers/_app"
import type { inferProcedureOutput } from "@trpc/server"
import { trpc } from "@/shared/providers/trpc-provider"
import { LoadingCard } from "@/shared/ui/loading"
import { Button } from "@/shared/ui/button"
import MarketWithPredictionCard from "@/features/market/market-with-prediction-card.client"
import { PopularTagsList } from "@/shared/ui/popular-tag-list.client"

// Use tRPC's inferred types
type TrendingMarketsResponse = inferProcedureOutput<AppRouter['markets']['trending']>

export function TrendingMarkets() {
  const [marketLimit, setMarketLimit] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [autoLoadCount, setAutoLoadCount] = useState(0)
  const [isBrowser, setIsBrowser] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  
  // Fetch trending markets using tRPC with more aggressive cache settings
  const {
    data: marketsData,
    isLoading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
  } = trpc.markets.trending.useQuery({
    limit: marketLimit,
    tagIds: selectedTagId ? [selectedTagId] : undefined,
  }, {
    // More aggressive cache settings to prevent stale data
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // Extract active tags from markets response (guaranteed alignment)
  const activeTags = marketsData?.activeTags || []
  const tagsLoading = marketsLoading

  const markets = marketsData?.items || []
  const shouldShowManual = autoLoadCount >= 2
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Detect if we're in the browser (for portal safety)
  useEffect(() => {
    setIsBrowser(true)
    // Force a refresh when component mounts to ensure fresh data
    refetchMarkets()
  }, [refetchMarkets])


  // Tag selection handler
  const handleTagSelect = (tagId: string | null) => {
    setSelectedTagId(tagId)
    // Reset pagination when filtering changes
    setMarketLimit(10)
    setAutoLoadCount(0)
  }

  // Auto-load on scroll for first 2 times
  useEffect(() => {
    if (shouldShowManual || isLoadingMore || !marketsData?.hasMore) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleLoadMore(true)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )
    
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [shouldShowManual, isLoadingMore, marketsData?.hasMore, marketLimit])


  const handleLoadMore = async (isAutoLoad = false) => {
    setIsLoadingMore(true)
    const oldLimit = marketLimit
    const newLimit = oldLimit + 10
    
    if (isAutoLoad) {
      setAutoLoadCount(prev => prev + 1)
    }
    
    console.log(`Loading more markets: ${oldLimit} → ${newLimit} (${isAutoLoad ? 'auto' : 'manual'})`)
    setMarketLimit(newLimit)
    
    // Wait for the new data to be loaded
    try {
      await refetchMarkets()
      console.log(`Markets loaded: ${marketsData?.items?.length || 0}, hasMore: ${marketsData?.hasMore}`)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Client-side filtering with perfect alignment
  const filteredMarkets = selectedTagId 
    ? markets.filter(market => 
        market.event?.tags?.some((tag: any) => tag.id === selectedTagId)
      )
    : markets

  if (marketsLoading && markets.length === 0) {
    return <LoadingCard />
  }

  if (marketsError) {
    return (
      <div className="border rounded-lg p-8 text-center bg-card">
        <p className="text-destructive">Error loading trending markets</p>
        <Button
          onClick={() => refetchMarkets()}
          variant="primary"
          size="sm"
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <section className="space-y-6">
        {/* Header */}
        <div className={components.pageHeader.container}>
          <h1 className={components.pageHeader.title + " flex items-center justify-center gap-2"}>
            <TrendingUp className={components.pageHeader.icon} />
            Trending Markets
          </h1>
          <p className={components.pageHeader.subtitle}>
            Markets with the highest daily trading volume
          </p>
        </div>

        {/* Active Tags List */}
        {!tagsLoading && activeTags.length > 0 && (
          <div className="w-full">
            <PopularTagsList 
              tags={activeTags} 
              selectedTagId={selectedTagId}
              onTagSelect={handleTagSelect}
            />
          </div>
        )}

        {/* Markets Grid */}
        {filteredMarkets.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-card">
            <p className="text-muted-foreground">
              No trending markets available
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
                <MarketWithPredictionCard
                  market={market}
                  event={market.event}
                  latestPrediction={market.latestPrediction}
                  className="h-full"
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Auto-load sentinel for first 2 loads */}
        {!shouldShowManual && marketsData?.hasMore && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}

        {/* Manual Show More Button - appears after 2 auto-loads */}
        {shouldShowManual && marketsData?.hasMore && (
          <div className="text-center">
            <Button
              onClick={() => handleLoadMore(false)}
              disabled={marketsLoading || isLoadingMore}
              variant="secondary"
              size="lg"
              className="gap-2 touch-manipulation"
              aria-label="Load more trending markets"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Loading More...</span>
                </>
              ) : (
                <>
                  <span>Show More Markets</span>
                  <ChevronDown className={`${components.disclosure.icon} ${components.disclosure.iconMd}`} />
                </>
              )}
            </Button>
          </div>
        )}
      </section>

      {/* Loading overlay using portal to bypass parent container constraints */}
      {isBrowser && (marketsLoading || isLoadingMore) && markets.length > 0 && 
        createPortal(
          <div className={components.loading.overlay.container}>
            <div className={components.loading.overlay.card}>
              <div className={components.loading.overlay.content}>
                <div className={components.loading.overlay.spinner} />
                Loading more markets...
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  )
}