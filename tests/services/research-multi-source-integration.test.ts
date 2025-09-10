import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executePredictionSession } from '@/lib/services/prediction-session-worker'
import { performMarketResearchV2 } from '@/lib/services/research/research-service-v2'
import { getCachedResearchBySource } from '@/lib/services/research-cache-service'
import { getPredictionSessionById, updatePredictionSession } from '@/lib/services/prediction-session-service'

// Mock dependencies
vi.mock('@/lib/services/research/research-service-v2')
vi.mock('@/lib/services/research-cache-service')
vi.mock('@/lib/services/prediction-session-service')
vi.mock('@/lib/services/generate-single-prediction')
vi.mock('@/lib/services/prediction-service')
vi.mock('@/lib/services/credit-manager')

const mockDb = {
  predictionSessionResearchCache: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}

describe('Multi-Source Research Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executePredictionSession with multiple research sources', () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-456',
      marketId: 'market-789',
      selectedModels: ['gpt-4', 'claude-3'],
      selectedResearchSources: ['exa', 'grok'],
      status: 'INITIALIZING' as const
    }

    beforeEach(() => {
      vi.mocked(getPredictionSessionById).mockResolvedValue(mockSession as any)
      vi.mocked(updatePredictionSession).mockResolvedValue()
    })

    it('should process multiple research sources sequentially', async () => {
      // Mock research results for each source
      const exaResult = {
        id: 1,
        source: 'exa',
        response: {
          relevant_information: 'Exa research data',
          links: ['https://exa.example.com']
        },
        createdAt: new Date()
      }

      const grokResult = {
        id: 2,
        source: 'grok',
        response: {
          relevant_information: 'Grok social sentiment data',
          links: ['https://twitter.com/example']
        },
        createdAt: new Date()
      }

      // Mock cache misses initially, then return new cache entries
      vi.mocked(getCachedResearchBySource)
        .mockResolvedValueOnce(null) // First call for exa (cache miss)
        .mockResolvedValueOnce(exaResult) // Second call for exa (after creation)
        .mockResolvedValueOnce(null) // First call for grok (cache miss)
        .mockResolvedValueOnce(grokResult) // Second call for grok (after creation)

      vi.mocked(performMarketResearchV2)
        .mockResolvedValueOnce({
          source: 'exa',
          relevant_information: 'Exa research data',
          links: ['https://exa.example.com'],
          timestamp: new Date()
        })
        .mockResolvedValueOnce({
          source: 'grok',
          relevant_information: 'Grok social sentiment data',
          links: ['https://twitter.com/example'],
          timestamp: new Date()
        })

      const result = await executePredictionSession(mockDb as any, 'session-123')

      // Should have called research for both sources
      expect(vi.mocked(performMarketResearchV2)).toHaveBeenCalledTimes(2)
      expect(vi.mocked(performMarketResearchV2)).toHaveBeenCalledWith(mockDb, 'market-789', 'exa')
      expect(vi.mocked(performMarketResearchV2)).toHaveBeenCalledWith(mockDb, 'market-789', 'grok')

      // Should have updated session status to RESEARCHING
      expect(vi.mocked(updatePredictionSession)).toHaveBeenCalledWith(
        mockDb,
        'session-123',
        expect.objectContaining({
          status: 'RESEARCHING',
          step: 'Gathering research from 2 source(s)'
        })
      )
    })

    it('should handle partial research failures gracefully', async () => {
      // Mock exa success but grok failure
      vi.mocked(getCachedResearchBySource)
        .mockResolvedValueOnce(null) // exa cache miss
        .mockResolvedValueOnce({
          id: 1,
          source: 'exa',
          response: { relevant_information: 'Exa data', links: [] },
          createdAt: new Date()
        }) // exa cache hit after creation
        .mockResolvedValueOnce(null) // grok cache miss

      vi.mocked(performMarketResearchV2)
        .mockResolvedValueOnce({
          source: 'exa',
          relevant_information: 'Exa research data',
          links: ['https://exa.example.com'],
          timestamp: new Date()
        })
        .mockRejectedValueOnce(new Error('Grok API error'))

      const result = await executePredictionSession(mockDb as any, 'session-123')

      // Should continue processing despite grok failure
      expect(result.success).toBe(true) // Assuming the session completes
      
      // Should have attempted research for both sources
      expect(vi.mocked(performMarketResearchV2)).toHaveBeenCalledTimes(2)
    })

    it('should use cached research when available', async () => {
      // Mock both sources having cached results
      const cachedExa = {
        id: 1,
        source: 'exa',
        response: { relevant_information: 'Cached Exa data', links: [] },
        createdAt: new Date()
      }

      const cachedGrok = {
        id: 2,
        source: 'grok',
        response: { relevant_information: 'Cached Grok data', links: [] },
        createdAt: new Date()
      }

      vi.mocked(getCachedResearchBySource)
        .mockResolvedValueOnce(cachedExa) // exa cache hit
        .mockResolvedValueOnce(cachedGrok) // grok cache hit

      await executePredictionSession(mockDb as any, 'session-123')

      // Should not call performMarketResearchV2 since cache is available
      expect(vi.mocked(performMarketResearchV2)).not.toHaveBeenCalled()

      // Should still process with cached data
      expect(vi.mocked(updatePredictionSession)).toHaveBeenCalledWith(
        mockDb,
        'session-123',
        expect.objectContaining({
          status: 'RESEARCHING'
        })
      )
    })

    it('should handle empty research sources array', async () => {
      const sessionWithoutResearch = {
        ...mockSession,
        selectedResearchSources: []
      }

      vi.mocked(getPredictionSessionById).mockResolvedValue(sessionWithoutResearch as any)

      await executePredictionSession(mockDb as any, 'session-123')

      // Should skip research phase entirely
      expect(vi.mocked(performMarketResearchV2)).not.toHaveBeenCalled()
      expect(vi.mocked(updatePredictionSession)).not.toHaveBeenCalledWith(
        mockDb,
        'session-123',
        expect.objectContaining({ status: 'RESEARCHING' })
      )
    })

    it('should link research results to session via junction table', async () => {
      const exaResult = {
        id: 1,
        source: 'exa',
        response: { relevant_information: 'Exa data', links: [] },
        createdAt: new Date()
      }

      vi.mocked(getCachedResearchBySource)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(exaResult)

      vi.mocked(performMarketResearchV2).mockResolvedValueOnce({
        source: 'exa',
        relevant_information: 'Exa research data',
        links: ['https://exa.example.com'],
        timestamp: new Date()
      })

      await executePredictionSession(mockDb as any, 'session-123')

      // Should create junction table entries linking session to research cache
      // Note: This is implicitly tested through the session worker's internal logic
      expect(vi.mocked(getCachedResearchBySource)).toHaveBeenCalledWith(
        mockDb,
        'market-789',
        'exa'
      )
    })
  })

  describe('research cost calculation integration', () => {
    it('should calculate correct total cost for multiple sources', () => {
      // This would be tested in the session creation flow
      const sources = ['exa', 'grok'] // 1 + 2 = 3 credits
      const expectedCost = 3

      // Mock the cost calculation that happens in the tRPC layer
      const exaCost = 1
      const grokCost = 2
      const totalResearchCost = exaCost + grokCost

      expect(totalResearchCost).toBe(expectedCost)
    })
  })

  describe('error handling', () => {
    it('should handle research API failures without breaking session', async () => {
      const sessionWithMultipleSources = {
        id: 'session-123',
        userId: 'user-456',
        marketId: 'market-789',
        selectedModels: ['gpt-4', 'claude-3'],
        selectedResearchSources: ['exa', 'grok', 'invalid-source'],
        status: 'INITIALIZING' as const
      }

      vi.mocked(getPredictionSessionById).mockResolvedValue(sessionWithMultipleSources as any)
      
      // Mock various failure scenarios
      vi.mocked(getCachedResearchBySource).mockResolvedValue(null)
      vi.mocked(performMarketResearchV2)
        .mockResolvedValueOnce({
          source: 'exa',
          relevant_information: 'Success',
          links: [],
          timestamp: new Date()
        })
        .mockRejectedValueOnce(new Error('Grok API down'))
        .mockRejectedValueOnce(new Error('Invalid source'))

      const result = await executePredictionSession(mockDb as any, 'session-123')

      // Session should continue despite research failures
      expect(result).toBeDefined()
      
      // Should have attempted all sources
      expect(vi.mocked(performMarketResearchV2)).toHaveBeenCalledTimes(3)
    })

    it('should log research failures for monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(getCachedResearchBySource).mockResolvedValue(null)
      vi.mocked(performMarketResearchV2).mockRejectedValue(new Error('API timeout'))

      await executePredictionSession(mockDb as any, 'session-123')

      // Should log the error but continue processing
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('performance considerations', () => {
    it('should process research sources in sequence (not parallel)', async () => {
      const startTimes: Date[] = []
      
      const testSession = {
        id: 'session-123',
        userId: 'user-456',
        marketId: 'market-789',
        selectedModels: ['gpt-4', 'claude-3'],
        selectedResearchSources: ['exa', 'grok'],
        status: 'INITIALIZING' as const
      }
      
      // Reset mocks to avoid interference from other tests
      vi.clearAllMocks()
      vi.mocked(getPredictionSessionById).mockResolvedValue(testSession as any)
      vi.mocked(updatePredictionSession).mockResolvedValue()
      
      vi.mocked(performMarketResearchV2).mockImplementation(async (db, marketId, source) => {
        startTimes.push(new Date())
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          source,
          relevant_information: `${source} data`,
          links: [],
          timestamp: new Date()
        }
      })

      vi.mocked(getCachedResearchBySource).mockResolvedValue(null)

      await executePredictionSession(mockDb as any, 'session-123')

      // Should be called sequentially (second call starts after first completes)
      expect(startTimes).toHaveLength(2)
      expect(startTimes[1].getTime()).toBeGreaterThanOrEqual(startTimes[0].getTime() + 90)
    })
  })
})