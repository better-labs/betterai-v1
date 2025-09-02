'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useUser } from '@/hooks/use-user'
import type { MarketDTO } from '@/lib/types'

const STALENESS_THRESHOLD_HOURS = 12

/**
 * Hook to detect and handle stale market data
 * Automatically refreshes market data if it's older than 12 hours (only for authenticated users)
 */
export function useMarketStaleness(market: MarketDTO | null) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const { user, isAuthenticated, isReady } = useUser()
  
  const refreshMarket = trpc.markets.refresh.useMutation({
    onMutate: () => {
      setIsRefreshing(true)
      setRefreshError(null)
    },
    onSuccess: () => {
      setIsRefreshing(false)
      // Trigger page refresh to show updated data
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
    onError: (error) => {
      setIsRefreshing(false)
      setRefreshError(error.message)
      console.error('Failed to refresh market:', error)
    }
  })

  // Check if market data is stale
  const isStale = (market: MarketDTO): boolean => {
    if (!market.updatedAt) return true
    
    const updatedAt = new Date(market.updatedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff > STALENESS_THRESHOLD_HOURS
  }

  // Auto-refresh on mount if data is stale AND user is authenticated
  useEffect(() => {
    // Wait for authentication state to be ready before attempting refresh
    if (!isReady) return
    
    // Only auto-refresh for authenticated users
    if (!isAuthenticated || !user?.id) return
    
    if (market && isStale(market) && !isRefreshing && !refreshError) {
      console.log(`Market ${market.id} is stale (${market.updatedAt}), triggering refresh for authenticated user ${user.id}`)
      refreshMarket.mutate({ marketId: market.id })
    }
  }, [market?.id, market?.updatedAt, isReady, isAuthenticated, user?.id]) // Include auth dependencies

  return {
    isStale: market ? isStale(market) : false,
    isRefreshing,
    refreshError,
    isAuthenticated,
    isReady,
    triggerRefresh: () => {
      if (market && !isRefreshing && isAuthenticated) {
        refreshMarket.mutate({ marketId: market.id })
      }
    }
  }
}