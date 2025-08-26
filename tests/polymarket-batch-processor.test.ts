import { describe, it, expect } from 'vitest'
import {
  validatePolymarketEvent,
  validatePolymarketMarket,
  transformEventToDbFormat,
  transformMarketToDbFormat
} from '../lib/services/polymarket-batch-processor'
import type { PolymarketEvent } from '@/lib/types'
import { Decimal } from '@prisma/client/runtime/library'

describe('polymarket-batch-processor', () => {
  describe('validatePolymarketEvent', () => {
    it('should validate a correct event', () => {
      const event = {
        id: 'test-event-1',
        title: 'Test Event',
        description: 'Test Description',
        volume: 1000,
        slug: 'test-event',
        tags: []
      }
      
      expect(validatePolymarketEvent(event)).toBe(true)
    })

    it('should reject invalid events', () => {
      expect(validatePolymarketEvent(null as any)).toBe(false)
      expect(validatePolymarketEvent({})).toBe(false)
      expect(validatePolymarketEvent({ id: 123 } as any)).toBe(false)
      expect(validatePolymarketEvent({ id: 'test', title: 123 } as any)).toBe(false)
    })
  })

  describe('validatePolymarketMarket', () => {
    it('should validate a correct market', () => {
      const market = {
        id: 'test-market-1',
        question: 'Test Question?',
        outcomePrices: '[0.5, 0.5]',
        volume: '1000',
        liquidity: '500',
        eventId: 'test-event-1'
      }
      
      expect(validatePolymarketMarket(market)).toBe(true)
    })
  })

  describe('transformEventToDbFormat', () => {
    it('should transform event correctly', () => {
      const event: PolymarketEvent = {
        id: 'test-event-1',
        title: 'Test Event',
        description: 'Test Description',
        volume: 1000,
        slug: 'test-event',
        icon: 'icon-url',
        image: 'image-url',
        category: 'test-category',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tags: [
          { id: 'tag-1', label: 'politics', slug: 'politics', forceShow: false, updatedAt: '2025-01-01T00:00:00Z' }
        ],
        markets: []
      }

      const result = transformEventToDbFormat(event)

      expect(result.id).toBe('test-event-1')
      expect(result.title).toBe('Test Event')
      expect(result.description).toBe('Test Description')
      expect(result.volume).toBeInstanceOf(Decimal)
      expect(result.marketProvider).toBe('Polymarket')
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.category).toBeDefined() // mapTagsToCategory result
    })
  })

  describe('transformMarketToDbFormat', () => {
    it('should transform market correctly', () => {
      const market = {
        id: 'test-market-1',
        question: 'Test Question?',
        description: 'Test market description',
        outcomePrices: '[0.4, 0.6]',
        outcomes: '["Yes", "No"]',
        volume: '1000',
        liquidity: '500',
        active: true,
        closed: false,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        slug: 'test-market',
        icon: 'market-icon',
        image: 'market-image',
        resolutionSource: 'test-source',
        eventId: 'test-event-1'
      }

      const result = transformMarketToDbFormat(market)

      expect(result.id).toBe('test-market-1')
      expect(result.question).toBe('Test Question?')
      expect(result.eventId).toBe('test-event-1')
      expect(result.outcomePrices).toHaveLength(2)
      expect(result.outcomePrices?.[0]).toBeInstanceOf(Decimal)
      expect(result.outcomes).toEqual(['Yes', 'No'])
      expect(result.volume).toBeInstanceOf(Decimal)
      expect(result.active).toBe(true)
    })

    it('should handle parsing errors gracefully', () => {
      const market = {
        id: 'test-market-1',
        question: 'Test Question?',
        outcomePrices: 'invalid-json',
        outcomes: 'invalid-json', 
        volume: '1000',
        liquidity: '500',
        eventId: 'test-event-1'
      }

      const result = transformMarketToDbFormat(market)

      expect(result.outcomePrices).toEqual([])
      expect(result.outcomes).toBeNull()
    })
  })
})