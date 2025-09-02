'use client'

import { useEffect } from 'react'
import { useMarketStaleness } from '@/lib/hooks/use-market-staleness'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import type { MarketDTO } from '@/lib/types'

interface MarketStalenessHandlerProps {
  market: MarketDTO
}

export function MarketStalenessHandler({ market }: MarketStalenessHandlerProps) {
  const { isStale, isRefreshing, refreshError, isAuthenticated, isReady, triggerRefresh } = useMarketStaleness(market)

  // Don't render anything while refreshing - let the automatic refresh happen
  if (isRefreshing) {
    return (
      <Alert className="mb-6">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Refreshing market data from Polymarket...
        </AlertDescription>
      </Alert>
    )
  }

  // Show error if refresh failed
  if (refreshError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to refresh market data: {refreshError}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerRefresh}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Show manual refresh option if data is stale
  if (isStale && isReady) {
    if (!isAuthenticated) {
      // Show informational message for unauthenticated users
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Market data is more than 12 hours old. Log in to refresh market data automatically.
          </AlertDescription>
        </Alert>
      )
    }

    // Show refresh button for authenticated users
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Market data is more than 12 hours old</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerRefresh}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Don't render anything if data is fresh
  return null
}