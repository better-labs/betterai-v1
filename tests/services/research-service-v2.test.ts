import { describe, it, expect, vi, beforeEach } from 'vitest'
import { performMarketResearchV2 } from '@/lib/services/research/research-service-v2'
import { getCachedResearchBySource } from '@/lib/services/research-cache-service'
import { getMarketById } from '@/lib/services/market-service'

// Mock dependencies
vi.mock('@/lib/services/market-service')
vi.mock('@/lib/services/research-cache-service')

// Mock fetch globally
global.fetch = vi.fn()

const mockDb = {
  researchCache: {
    create: vi.fn(),
    findFirst: vi.fn()
  }
}

const mockMarket = {
  id: 'market-123',
  question: 'Will AI achieve AGI by 2025?',
  description: 'Advanced AI development prediction',
  outcomes: ['Yes', 'No']
}

describe('Research Service V2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMarketById).mockResolvedValue(mockMarket)
    vi.mocked(getCachedResearchBySource).mockResolvedValue(null)
  })

  describe('performMarketResearchV2', () => {
    it('should throw error for unsupported research source', async () => {
      await expect(
        performMarketResearchV2(mockDb as any, 'market-123', 'unsupported-source')
      ).rejects.toThrow('Unsupported research source: unsupported-source')
    })

    it('should route to Exa.ai research for exa source', async () => {
      // Mock successful Exa.ai API response
      const mockExaResponse = {
        results: [
          {
            text: 'AI development is progressing rapidly with new breakthroughs',
            url: 'https://example.com/ai-news'
          },
          {
            text: 'Experts predict AGI milestone within years',
            url: 'https://example.com/agi-prediction'
          }
        ]
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExaResponse)
      } as Response)

      // Mock environment variable
      const originalEnv = process.env.EXA_API_KEY
      process.env.EXA_API_KEY = 'test-exa-key'

      const result = await performMarketResearchV2(mockDb as any, 'market-123', 'exa')

      expect(result).toEqual({
        source: 'exa',
        relevant_information: 'AI development is progressing rapidly with new breakthroughs\nExperts predict AGI milestone within years',
        links: ['https://example.com/ai-news', 'https://example.com/agi-prediction'],
        confidence_score: expect.any(Number),
        timestamp: expect.any(Date)
      })

      expect(fetch).toHaveBeenCalledWith('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-exa-key'
        },
        body: JSON.stringify({
          query: 'Will AI achieve AGI by 2025? Advanced AI development prediction recent developments news',
          numResults: 10,
          startPublishedDate: expect.any(String), // Dynamic date
          useAutoprompt: true
        })
      })

      // Restore environment
      process.env.EXA_API_KEY = originalEnv
    })

    it('should handle missing EXA_API_KEY', async () => {
      const originalEnv = process.env.EXA_API_KEY
      delete process.env.EXA_API_KEY

      await expect(
        performMarketResearchV2(mockDb as any, 'market-123', 'exa')
      ).rejects.toThrow('EXA_API_KEY environment variable not set')

      // Restore environment
      process.env.EXA_API_KEY = originalEnv
    })

    it('should route to Grok research for grok source', async () => {
      // Set required environment variable
      const originalEnv = process.env.OPENROUTER_API_KEY
      process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

      // Mock the OpenRouter fetch function that's used internally
      const mockGrokResponse = {
        relevant_information: 'Social sentiment analysis shows mixed opinions on AGI timeline',
        links: ['https://twitter.com/ai_expert', 'https://twitter.com/tech_news']
      }

      // We need to mock the internal fetchStructuredFromOpenRouter function
      vi.doMock('@/lib/services/openrouter-client', () => ({
        fetchStructuredFromOpenRouter: vi.fn().mockResolvedValue(mockGrokResponse)
      }))

      const result = await performMarketResearchV2(mockDb as any, 'market-123', 'grok')

      expect(result.source).toBe('grok')
      expect(result.relevant_information).toContain('Social sentiment analysis')
      expect(result.links).toEqual(['https://twitter.com/ai_expert', 'https://twitter.com/tech_news'])
      expect(result.timestamp).toBeInstanceOf(Date)

      // Restore environment
      process.env.OPENROUTER_API_KEY = originalEnv
    })

    it('should handle market not found', async () => {
      vi.mocked(getMarketById).mockResolvedValue(null)

      await expect(
        performMarketResearchV2(mockDb as any, 'nonexistent-market', 'exa')
      ).rejects.toThrow('Market nonexistent-market not found')
    })

    it('should handle Exa.ai API errors gracefully', async () => {
      process.env.EXA_API_KEY = 'test-key'

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response)

      await expect(
        performMarketResearchV2(mockDb as any, 'market-123', 'exa')
      ).rejects.toThrow()
    })
  })

  describe('cache integration', () => {
    it('should use cached research when available', async () => {
      const cachedResult = {
        id: 1,
        source: 'exa',
        response: {
          relevant_information: 'Cached AI research data',
          links: ['https://cached-example.com']
        },
        createdAt: new Date()
      }

      vi.mocked(getCachedResearchBySource).mockResolvedValue(cachedResult)

      const result = await performMarketResearchV2(mockDb as any, 'market-123', 'exa')

      expect(result).toEqual({
        relevant_information: 'Cached AI research data',
        links: ['https://cached-example.com'],
        timestamp: expect.any(Date)
      })

      // Should not call external APIs when cache is available
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('multi-source processing', () => {
    it('should handle multiple research sources independently', async () => {
      // This test simulates how multiple sources would be processed
      const sources = ['exa', 'grok']
      const results = []

      for (const source of sources) {
        if (source === 'exa') {
          process.env.EXA_API_KEY = 'test-exa-key'
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              results: [{ text: 'Exa research data', url: 'https://exa.example.com' }]
            })
          } as Response)
        } else if (source === 'grok') {
          // This will fail due to missing OPENROUTER_API_KEY, which is expected
          delete process.env.OPENROUTER_API_KEY
        }

        try {
          const result = await performMarketResearchV2(mockDb as any, 'market-123', source)
          results.push(result)
        } catch (error) {
          // Handle individual source failures gracefully
          console.error(`Research failed for source ${source}:`, error)
        }
      }

      expect(results).toHaveLength(1) // Only Exa should succeed in this mock setup
      expect(results[0].source).toBe('exa')
    })
  })

  describe('research source validation', () => {
    it('should validate supported research sources', async () => {
      // Set up environment for valid sources
      process.env.EXA_API_KEY = 'test-exa-key'
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [{ text: 'Test data', url: 'https://test.com' }]
        })
      } as Response)

      const validSources = ['exa', 'grok']
      const invalidSources = ['google', 'bing', 'invalid']

      for (const source of validSources) {
        // Should not throw for valid sources (though may fail for other reasons)
        try {
          await performMarketResearchV2(mockDb as any, 'market-123', source)
        } catch (error) {
          // Error should not be about unsupported source
          expect(error.message).not.toContain('Unsupported research source')
        }
      }

      for (const source of invalidSources) {
        await expect(
          performMarketResearchV2(mockDb as any, 'market-123', source)
        ).rejects.toThrow(`Unsupported research source: ${source}`)
      }
    })
  })
})