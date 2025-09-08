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
  endDate?: string | null
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
      return { closed: false } // Open for betting
    case 'resolved':  
      return { closed: true }   // Betting closed (includes resolved)
    case 'all':
    default:
      return {} // No filter
  }
}