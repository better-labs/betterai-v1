/**
 * Market status utility functions
 * 
 * Provides reliable market status checking based on Polymarket's actual behavior:
 * - market.closed: Indicates if betting is closed (most accurate)
 * - market.active: Always true (unreliable for status)  
 * - market.endDate: Settlement date, not betting close time
 */

export type MarketStatus = 'open' | 'closed' | 'resolved'

export interface MarketStatusFields {
  closed?: boolean | null
  active?: boolean | null
  umaResolutionStatus?: string | null
}

/**
 * Determines if a market is open for betting
 * @param market - Market with status fields
 * @returns true if market is accepting bets, false otherwise
 */
export function isMarketOpenForBetting(market: MarketStatusFields): boolean {
  return !market.closed
}

/**
 * Gets the comprehensive status of a market
 * @param market - Market with status fields
 * @returns Market status: 'open', 'closed', or 'resolved'
 */
export function getMarketStatus(market: MarketStatusFields & { umaResolutionStatus?: string | null }): MarketStatus {
  if (!market.closed) return 'open'
  if (market.umaResolutionStatus === 'resolved') return 'resolved'
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