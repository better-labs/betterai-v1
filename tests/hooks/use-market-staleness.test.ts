import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the tRPC client
const mockMutate = vi.fn()
const mockUseMutation = vi.fn().mockReturnValue({
  mutate: mockMutate
})

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    markets: {
      refresh: {
        useMutation: mockUseMutation
      }
    }
  }
}))

// Mock React hooks
const mockUseState = vi.fn()
const mockUseEffect = vi.fn()

vi.mock('react', () => ({
  useEffect: mockUseEffect,
  useState: mockUseState
}))

// Import the hook after mocking
const { useMarketStaleness } = await import('@/lib/hooks/use-market-staleness')

describe('useMarketStaleness Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup useState mock to return [false, mockSetState] for isRefreshing
    // and [null, mockSetError] for refreshError
    let stateIndex = 0
    mockUseState.mockImplementation(() => {
      stateIndex++
      if (stateIndex === 1) return [false, vi.fn()] // isRefreshing
      if (stateIndex === 2) return [null, vi.fn()]  // refreshError
      return [null, vi.fn()]
    })
  })

  describe('staleness detection', () => {
    it('should detect stale market (older than 12 hours)', () => {
      const thirteenHoursAgo = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
      
      const staleMarket = {
        id: 'market-123',
        question: 'Test market',
        updatedAt: thirteenHoursAgo,
        outcomePrices: [0.5, 0.5],
        volume: '1000',
        liquidity: '500',
        eventId: 'event-123',
        outcomes: ['Yes', 'No']
      } as any

      const result = useMarketStaleness(staleMarket)

      expect(result.isStale).toBe(true)
    })

    it('should detect fresh market (less than 12 hours)', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      
      const freshMarket = {
        id: 'market-456',
        question: 'Fresh market',
        updatedAt: oneHourAgo,
        outcomePrices: [0.6, 0.4],
        volume: '2000',
        liquidity: '1000'
      } as any

      const result = useMarketStaleness(freshMarket)

      expect(result.isStale).toBe(false)
    })

    it('should handle market with no updatedAt as stale', () => {
      const marketWithoutTimestamp = {
        id: 'market-789',
        question: 'No timestamp market',
        updatedAt: null,
        outcomePrices: [0.3, 0.7],
        volume: '500',
        liquidity: '250'
      } as any

      const result = useMarketStaleness(marketWithoutTimestamp)

      expect(result.isStale).toBe(true)
    })

    it('should handle null market', () => {
      const result = useMarketStaleness(null)

      expect(result.isStale).toBe(false)
    })
  })

  describe('auto-refresh behavior', () => {
    it('should trigger refresh for stale market on mount', () => {
      const staleMarket = {
        id: 'market-auto-refresh',
        question: 'Auto refresh test',
        updatedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        outcomePrices: [0.4, 0.6],
        volume: '3000',
        liquidity: '1500'
      } as any

      // Mock useEffect to simulate component mount
      mockUseEffect.mockImplementation((callback, deps) => {
        callback() // Simulate running the effect
      })

      useMarketStaleness(staleMarket)

      // Verify that the mutation was called with correct market ID
      expect(mockMutate).toHaveBeenCalledWith({ 
        marketId: 'market-auto-refresh' 
      })
    })

    it('should not trigger refresh for fresh market', () => {
      const freshMarket = {
        id: 'market-fresh',
        question: 'Fresh test',
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        outcomePrices: [0.8, 0.2],
        volume: '4000',
        liquidity: '2000'
      } as any

      mockUseEffect.mockImplementation((callback, deps) => {
        callback()
      })

      useMarketStaleness(freshMarket)

      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('manual refresh trigger', () => {
    it('should provide triggerRefresh function', () => {
      const market = {
        id: 'market-manual',
        question: 'Manual refresh test',
        updatedAt: new Date().toISOString(),
        outcomePrices: [0.5, 0.5],
        volume: '1000',
        liquidity: '500'
      } as any

      const result = useMarketStaleness(market)

      expect(typeof result.triggerRefresh).toBe('function')
    })
  })
})