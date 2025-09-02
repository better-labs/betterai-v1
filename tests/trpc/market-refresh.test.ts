import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'

// Mock the market service
vi.mock('@/lib/services/market-service', () => ({
  getMarketById: vi.fn(),
  refreshMarketFromPolymarket: vi.fn()
}))

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {}
}))

describe('tRPC Markets Router - Refresh Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('markets.refresh', () => {
    it('should successfully refresh market', async () => {
      const { getMarketById, refreshMarketFromPolymarket } = await import('@/lib/services/market-service')
      
      // Mock successful responses
      const mockExistingMarket = { id: 'market-123', question: 'Test market' } as any
      const mockRefreshedMarket = { 
        id: 'market-123', 
        question: 'Test market',
        updatedAt: new Date().toISOString(),
        volume: '50000',
        liquidity: '25000'
      } as any

      vi.mocked(getMarketById).mockResolvedValue(mockExistingMarket)
      vi.mocked(refreshMarketFromPolymarket).mockResolvedValue(mockRefreshedMarket)

      // Import the router after mocking
      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      // Create mock context (authenticated user)
      const mockContext = {
        userId: 'user-123',
        req: undefined,
        rateLimitId: 'test-rate-limit'
      }

      // Create a test caller
      const caller = marketsRouter.createCaller(mockContext)

      // Execute the refresh
      const result = await caller.refresh({ marketId: 'market-123' })

      // Assertions
      expect(getMarketById).toHaveBeenCalledWith({}, 'market-123')
      expect(refreshMarketFromPolymarket).toHaveBeenCalledWith({}, 'market-123')
      expect(result).toEqual({
        success: true,
        market: mockRefreshedMarket,
        message: 'Market data refreshed successfully'
      })
    })

    it('should throw NOT_FOUND when market does not exist', async () => {
      const { getMarketById } = await import('@/lib/services/market-service')
      
      // Mock market not found
      vi.mocked(getMarketById).mockResolvedValue(null)

      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      const mockContext = {
        userId: 'user-123',
        req: undefined,
        rateLimitId: 'test-rate-limit'
      }

      const caller = marketsRouter.createCaller(mockContext)

      // Should throw NOT_FOUND error
      await expect(
        caller.refresh({ marketId: 'nonexistent-market' })
      ).rejects.toThrow(TRPCError)

      await expect(
        caller.refresh({ marketId: 'nonexistent-market' })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Market not found'
      })
    })

    it('should throw INTERNAL_SERVER_ERROR when refresh returns null', async () => {
      const { getMarketById, refreshMarketFromPolymarket } = await import('@/lib/services/market-service')
      
      // Mock existing market but failed refresh
      vi.mocked(getMarketById).mockResolvedValue({ id: 'market-123' } as any)
      vi.mocked(refreshMarketFromPolymarket).mockResolvedValue(null)

      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      const mockContext = {
        userId: 'user-123',
        req: undefined,
        rateLimitId: 'test-rate-limit'
      }

      const caller = marketsRouter.createCaller(mockContext)

      await expect(
        caller.refresh({ marketId: 'market-123' })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch updated market data from Polymarket'
      })
    })

    it('should require authentication', async () => {
      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      // Create mock context without userId (unauthenticated)
      const unauthenticatedContext = {
        userId: undefined,
        req: undefined,
        rateLimitId: undefined
      }

      const caller = marketsRouter.createCaller(unauthenticatedContext)

      await expect(
        caller.refresh({ marketId: 'market-123' })
      ).rejects.toThrow(TRPCError)

      await expect(
        caller.refresh({ marketId: 'market-123' })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource'
      })
    })

    it('should validate input marketId', async () => {
      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      const mockContext = {
        userId: 'user-123',
        req: undefined,
        rateLimitId: 'test-rate-limit'
      }

      const caller = marketsRouter.createCaller(mockContext)

      // Should throw validation error for empty marketId
      await expect(
        caller.refresh({ marketId: '' })
      ).rejects.toThrow()

      // Should throw validation error for missing marketId
      await expect(
        caller.refresh({} as any)
      ).rejects.toThrow()
    })

    it('should handle service errors gracefully', async () => {
      const { getMarketById } = await import('@/lib/services/market-service')
      
      // Mock service throwing error
      vi.mocked(getMarketById).mockRejectedValue(new Error('Database connection failed'))

      const { marketsRouter } = await import('@/lib/trpc/routers/markets')
      
      const mockContext = {
        userId: 'user-123',
        req: undefined,
        rateLimitId: 'test-rate-limit'
      }

      const caller = marketsRouter.createCaller(mockContext)

      await expect(
        caller.refresh({ marketId: 'market-123' })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh market data'
      })
    })
  })
})