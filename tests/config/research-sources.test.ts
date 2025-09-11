import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RESEARCH_SOURCES,
  getResearchSource,
  getAvailableResearchSources,
  getResearchSourceCost,
  isResearchSourceAvailable,
  validateResearchSourceId,
  calculateResearchSourcesCost,
  validateResearchSourceEnvironment
} from '@/lib/config/research-sources'

describe('Research Sources Configuration', () => {
  describe('RESEARCH_SOURCES constant', () => {
    it('should contain expected research sources', () => {
      expect(RESEARCH_SOURCES).toHaveLength(2)
      
      const sourceIds = RESEARCH_SOURCES.map(source => source.id)
      expect(sourceIds).toContain('exa')
      expect(sourceIds).toContain('grok')
    })

    it('should have proper structure for each source', () => {
      for (const source of RESEARCH_SOURCES) {
        expect(source).toHaveProperty('id')
        expect(source).toHaveProperty('name')
        expect(source).toHaveProperty('description')
        expect(source).toHaveProperty('provider')
        expect(source).toHaveProperty('creditCost')
        expect(source).toHaveProperty('available')
        
        expect(typeof source.id).toBe('string')
        expect(typeof source.name).toBe('string')
        expect(typeof source.description).toBe('string')
        expect(typeof source.provider).toBe('string')
        expect(typeof source.creditCost).toBe('number')
        expect(typeof source.available).toBe('boolean')
        expect(source.creditCost).toBeGreaterThan(0)
      }
    })

    it('should have expected properties for Exa.ai source', () => {
      const exaSource = RESEARCH_SOURCES.find(source => source.id === 'exa')
      
      expect(exaSource).toBeDefined()
      expect(exaSource?.name).toBe('Exa.ai')
      expect(exaSource?.provider).toBe('Exa.ai')
      expect(exaSource?.creditCost).toBe(1)
      expect(exaSource?.available).toBe(true)
      expect(exaSource?.description).toContain('web search')
    })

    it('should have expected properties for Grok source', () => {
      const grokSource = RESEARCH_SOURCES.find(source => source.id === 'grok')
      
      expect(grokSource).toBeDefined()
      expect(grokSource?.name).toBe('X (Twitter)')
      expect(grokSource?.provider).toBe('Grok AI')
      expect(grokSource?.creditCost).toBe(2)
      expect(grokSource?.available).toBe(true)
      expect(grokSource?.description).toContain('Twitter')
    })
  })

  describe('getResearchSource', () => {
    it('should return source for valid ID', () => {
      const exaSource = getResearchSource('exa')
      expect(exaSource?.id).toBe('exa')
      expect(exaSource?.name).toBe('Exa.ai')

      const grokSource = getResearchSource('grok')
      expect(grokSource?.id).toBe('grok')
      expect(grokSource?.name).toBe('X (Twitter)')
    })

    it('should return undefined for invalid ID', () => {
      expect(getResearchSource('invalid')).toBeUndefined()
      expect(getResearchSource('google')).toBeUndefined()
      expect(getResearchSource('')).toBeUndefined()
    })
  })

  describe('getAvailableResearchSources', () => {
    it('should return only available sources', () => {
      const availableSources = getAvailableResearchSources()
      
      expect(availableSources).toHaveLength(2) // Both exa and grok should be available
      
      for (const source of availableSources) {
        expect(source.available).toBe(true)
      }
    })

    it('should return sources in expected order', () => {
      const availableSources = getAvailableResearchSources()
      const sourceIds = availableSources.map(source => source.id)
      
      expect(sourceIds).toEqual(['exa', 'grok'])
    })
  })

  describe('getResearchSourceCost', () => {
    it('should return correct cost for valid sources', () => {
      expect(getResearchSourceCost('exa')).toBe(1)
      expect(getResearchSourceCost('grok')).toBe(2)
    })

    it('should return 0 for invalid sources', () => {
      expect(getResearchSourceCost('invalid')).toBe(0)
      expect(getResearchSourceCost('google')).toBe(0)
      expect(getResearchSourceCost('')).toBe(0)
    })
  })

  describe('isResearchSourceAvailable', () => {
    it('should return true for available sources', () => {
      expect(isResearchSourceAvailable('exa')).toBe(true)
      expect(isResearchSourceAvailable('grok')).toBe(true)
    })

    it('should return false for unavailable or invalid sources', () => {
      expect(isResearchSourceAvailable('invalid')).toBe(false)
      expect(isResearchSourceAvailable('google')).toBe(false)
      expect(isResearchSourceAvailable('')).toBe(false)
    })
  })

  describe('validateResearchSourceId', () => {
    it('should return true for valid source IDs', () => {
      expect(validateResearchSourceId('exa')).toBe(true)
      expect(validateResearchSourceId('grok')).toBe(true)
    })

    it('should return false for invalid source IDs', () => {
      expect(validateResearchSourceId('invalid')).toBe(false)
      expect(validateResearchSourceId('google')).toBe(false)
      expect(validateResearchSourceId('')).toBe(false)
    })

    it('should provide type safety for TypeScript', () => {
      const sourceId = 'exa'
      if (validateResearchSourceId(sourceId)) {
        // TypeScript should recognize this as a valid ResearchSourceId type
        expect(['exa', 'grok']).toContain(sourceId)
      }
    })
  })

  describe('calculateResearchSourcesCost', () => {
    it('should calculate cost for single source', () => {
      expect(calculateResearchSourcesCost(['exa'])).toBe(1)
      expect(calculateResearchSourcesCost(['grok'])).toBe(2)
    })

    it('should calculate cost for multiple sources', () => {
      expect(calculateResearchSourcesCost(['exa', 'grok'])).toBe(3) // 1 + 2
    })

    it('should handle empty array', () => {
      expect(calculateResearchSourcesCost([])).toBe(0)
    })

    it('should ignore invalid sources', () => {
      expect(calculateResearchSourcesCost(['exa', 'invalid', 'grok'])).toBe(3) // 1 + 0 + 2
    })

    it('should handle duplicate sources', () => {
      expect(calculateResearchSourcesCost(['exa', 'exa', 'grok'])).toBe(4) // 1 + 1 + 2
    })
  })

  describe('validateResearchSourceEnvironment', () => {
    const originalEnv = { ...process.env }

    afterEach(() => {
      // Restore original environment
      process.env = { ...originalEnv }
    })

    it('should detect available sources with proper environment variables', () => {
      process.env.EXA_API_KEY = 'test-exa-key'
      process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

      const result = validateResearchSourceEnvironment()

      expect(result.available).toContain('exa')
      expect(result.available).toContain('grok')
      expect(result.missing).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing environment variables', () => {
      delete process.env.EXA_API_KEY
      delete process.env.OPENROUTER_API_KEY

      const result = validateResearchSourceEnvironment()

      expect(result.available).toHaveLength(0)
      expect(result.missing).toContain('EXA_API_KEY (for Exa.ai)')
      expect(result.missing).toContain('OPENROUTER_API_KEY (for X (Twitter))')
    })

    it('should detect empty environment variables', () => {
      process.env.EXA_API_KEY = ''
      process.env.OPENROUTER_API_KEY = '   ' // Just whitespace

      const result = validateResearchSourceEnvironment()

      expect(result.available).toHaveLength(0)
      expect(result.missing).toContain('EXA_API_KEY (for Exa.ai)')
      expect(result.missing).toContain('OPENROUTER_API_KEY (for X (Twitter))')
    })

    it('should handle partial environment setup', () => {
      process.env.EXA_API_KEY = 'test-exa-key'
      delete process.env.OPENROUTER_API_KEY

      const result = validateResearchSourceEnvironment()

      expect(result.available).toContain('exa')
      expect(result.available).not.toContain('grok')
      expect(result.missing).toContain('OPENROUTER_API_KEY (for X (Twitter))')
      expect(result.missing).not.toContain('EXA_API_KEY')
    })
  })

  describe('type safety', () => {
    it('should provide proper TypeScript types', () => {
      const sources = RESEARCH_SOURCES
      
      // This test ensures TypeScript compilation works correctly
      sources.forEach(source => {
        expect(source.id).toMatch(/^(exa|grok)$/)
        expect(typeof source.creditCost).toBe('number')
        expect(typeof source.available).toBe('boolean')
      })
    })
  })
})