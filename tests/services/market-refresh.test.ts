import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refreshMarketFromPolymarket } from '@/lib/services/market-service'

// Mock the dynamic imports
vi.mock('@/lib/services/polymarket-client', () => ({
  fetchPolymarketMarket: vi.fn()
}))

vi.mock('@/lib/services/polymarket-batch-processor', () => ({
  transformMarketToDbFormat: vi.fn()
}))

vi.mock('@/lib/dtos', () => ({
  mapMarketToDTO: vi.fn()
}))

// Mock database client
const mockDb = {
  market: {
    upsert: vi.fn()
  }
}

describe('Market Refresh Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('refreshMarketFromPolymarket', () => {
    it('should successfully refresh market data', async () => {
      const marketId = 'test-market-123'
      
      // Setup mocks
      const mockPolymarketData = {
        id: marketId,
        question: 'Will X happen?',
        outcomePrices: '[0.6, 0.4]',
        volume: '50000',
        liquidity: '25000'
      }
      
      const mockTransformedData = {
        id: marketId,
        question: 'Will X happen?',
        outcomePrices: [0.6, 0.4],
        volume: 50000,
        liquidity: 25000,
        eventId: 'event-123'
      }
      
      const mockUpdatedMarket = {
        ...mockTransformedData,
        updatedAt: new Date()
      }
      
      const mockMarketDTO = {
        ...mockUpdatedMarket,
        updatedAt: mockUpdatedMarket.updatedAt.toISOString()
      } as any

      // Mock the dynamic imports
      const { fetchPolymarketMarket } = await import('@/lib/services/polymarket-client')
      const { transformMarketToDbFormat } = await import('@/lib/services/polymarket-batch-processor')
      const { mapMarketToDTO } = await import('@/lib/dtos')
      
      vi.mocked(fetchPolymarketMarket).mockResolvedValue(mockPolymarketData)
      vi.mocked(transformMarketToDbFormat).mockReturnValue(mockTransformedData)
      vi.mocked(mapMarketToDTO).mockReturnValue(mockMarketDTO)
      
      mockDb.market.upsert.mockResolvedValue(mockUpdatedMarket)

      // Execute
      const result = await refreshMarketFromPolymarket(mockDb as any, marketId)

      // Assertions
      expect(fetchPolymarketMarket).toHaveBeenCalledWith(marketId)
      expect(transformMarketToDbFormat).toHaveBeenCalledWith(mockPolymarketData)
      expect(mockDb.market.upsert).toHaveBeenCalledWith({
        where: { id: marketId },
        update: {
          question: 'Will X happen?',
          outcomePrices: [0.6, 0.4],
          volume: 50000,
          liquidity: 25000,
          eventId: 'event-123',
          updatedAt: expect.any(Date)
        },
        create: mockTransformedData
      })
      expect(mapMarketToDTO).toHaveBeenCalledWith(mockUpdatedMarket)
      expect(result).toEqual(mockMarketDTO)
    })

    it('should return null when Polymarket returns no data', async () => {
      const marketId = 'nonexistent-market'
      
      const { fetchPolymarketMarket } = await import('@/lib/services/polymarket-client')
      vi.mocked(fetchPolymarketMarket).mockResolvedValue(null)

      const result = await refreshMarketFromPolymarket(mockDb as any, marketId)

      expect(result).toBeNull()
      expect(mockDb.market.upsert).not.toHaveBeenCalled()
    })

    it('should throw error when Polymarket fetch fails', async () => {
      const marketId = 'error-market'
      
      const { fetchPolymarketMarket } = await import('@/lib/services/polymarket-client')
      vi.mocked(fetchPolymarketMarket).mockRejectedValue(new Error('API Error'))

      await expect(
        refreshMarketFromPolymarket(mockDb as any, marketId)
      ).rejects.toThrow('Failed to refresh market data: API Error')
    })

    it('should filter out null values from market data', async () => {
      const marketId = 'test-market-with-nulls'
      
      const mockPolymarketData = {
        id: marketId,
        question: 'Will Y happen?',
        description: null, // This should be filtered out
        outcomePrices: '[0.7, 0.3]'
      }
      
      const mockTransformedData = {
        id: marketId,
        question: 'Will Y happen?',
        description: null,
        outcomePrices: [0.7, 0.3],
        eventId: 'event-456'
      }

      const { fetchPolymarketMarket } = await import('@/lib/services/polymarket-client')
      const { transformMarketToDbFormat } = await import('@/lib/services/polymarket-batch-processor')
      const { mapMarketToDTO } = await import('@/lib/dtos')
      
      vi.mocked(fetchPolymarketMarket).mockResolvedValue(mockPolymarketData)
      vi.mocked(transformMarketToDbFormat).mockReturnValue(mockTransformedData)
      vi.mocked(mapMarketToDTO).mockReturnValue({ id: marketId } as any)
      
      mockDb.market.upsert.mockResolvedValue({ id: marketId })

      await refreshMarketFromPolymarket(mockDb as any, marketId)

      // Verify null values are filtered out of update data
      expect(mockDb.market.upsert).toHaveBeenCalledWith({
        where: { id: marketId },
        update: {
          // description should be filtered out since it was null
          question: 'Will Y happen?',
          outcomePrices: [0.7, 0.3],
          eventId: 'event-456',
          updatedAt: expect.any(Date)
        },
        create: {
          // create data keeps the filtered version
          id: marketId,
          question: 'Will Y happen?',
          outcomePrices: [0.7, 0.3],
          eventId: 'event-456'
        }
      })
    })
  })
})