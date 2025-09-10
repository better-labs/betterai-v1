/**
 * Market status utility functions
 * 
 * Provides reliable market status checking based on Polymarket's actual behavior:
 * - market.closedTime: When market was actually resolved (most reliable)
 * - market.closed: Indicates if betting is closed (accurate)
 * - market.active: Always true (unreliable for status)  
 * - market.endDate: Settlement date, not betting close time (fallback)
 */

export type MarketStatus = 'open' | 'closed' | 'resolved'

export interface MarketStatusFields {
  closed?: boolean | null
  active?: boolean | null
  closedTime?: Date | string | null
  umaResolutionStatus?: string | null
  endDate?: Date | string | null  // Made consistent with closedTime
}

/**
 * Determines if a market is open for betting
 * @param market - Market with status fields
 * @returns true if market is accepting bets, false otherwise
 */
export function isMarketOpenForBetting(market: MarketStatusFields): boolean {
  const now = new Date()
  
  // If market is explicitly marked as closed, it's not open for betting
  if (market.closed) return false
  
  // If closedTime exists and is in the past, market is closed
  if (market.closedTime) {
    const closedTime = new Date(market.closedTime)
    if (closedTime <= now) return false
  }
  
  // Fallback to endDate if closedTime not available
  const endDate = market.endDate ? new Date(market.endDate) : null
  if (endDate && endDate <= now) return false
  
  return true
}

/**
 * Gets the comprehensive status of a market
 * @param market - Market with status fields
 * @returns Market status: 'open', 'closed', or 'resolved'
 */
export function getMarketStatus(market: MarketStatusFields & { umaResolutionStatus?: string | null }): MarketStatus {
  const now = new Date()
  
  // Check if market is resolved first
  if (market.umaResolutionStatus === 'resolved') return 'resolved'
  
  // If market is open for betting, it's open
  if (isMarketOpenForBetting(market)) return 'open'
  
  // Otherwise it's closed
  return 'closed'
}

/**
 * Legacy compatibility: maps old status enum to new logic
 * @param statusFilter - Old status filter ('active' | 'resolved' | 'all')
 * @returns Database where clause for markets
 */
export function getMarketStatusFilter(statusFilter: 'active' | 'resolved' | 'all') {
  switch (statusFilter) {
    case 'active':
      return getOpenMarketsDatabaseFilter() // Use comprehensive filter for truly open markets
    case 'resolved':  
      return { closed: true }   // Betting closed (includes resolved)
    case 'all':
    default:
      return {} // No filter
  }
}

/**
 * Creates a comprehensive database filter for truly open markets
 * This replaces simple { closed: false } filters to avoid the mismatch
 * between database state and actual market status
 * 
 * @param options - Configuration options
 * @returns Prisma where clause that matches isMarketOpenForBetting() logic
 */
export function getOpenMarketsDatabaseFilter(options?: {
  /** Include markets ending within this many days (default: no time limit) */
  maxDaysUntilEnd?: number
  /** Include markets that ended within this many days ago (default: 0 - only future markets) */
  lookbackDays?: number
}) {
  const now = new Date()
  const filters: any[] = [
    { closed: false }  // Base requirement
  ]

  // Add time-based filters to match isMarketOpenForBetting() logic
  const timeFilters: any[] = []
  
  // Calculate minimum date for lookback (affects both closedTime and endDate)
  const minDate = options?.lookbackDays 
    ? new Date(Date.now() - options.lookbackDays * 24 * 60 * 60 * 1000)
    : now
  
  // Exclude markets with past closedTime (with optional lookback period)
  timeFilters.push({
    OR: [
      { closedTime: null },
      { closedTime: { gt: minDate } }
    ]
  })
  
  // Exclude markets with past endDate (with optional lookback period)  
  timeFilters.push({
    OR: [
      { endDate: null },
      { endDate: { gt: minDate } }
    ]
  })

  // Optional: limit to markets ending soon for performance
  if (options?.maxDaysUntilEnd) {
    const maxEndDate = new Date(Date.now() + options.maxDaysUntilEnd * 24 * 60 * 60 * 1000)
    timeFilters.push({
      OR: [
        { endDate: null },
        { endDate: { lte: maxEndDate } }
      ]
    })
  }

  return {
    AND: [
      ...filters,
      ...timeFilters
    ]
  }
}