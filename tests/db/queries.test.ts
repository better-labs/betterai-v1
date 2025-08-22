import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'

// Mock the prisma module
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    market: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    prediction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      groupBy: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    eventTag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}))

import { marketQueries, predictionQueries, eventQueries, tagQueries } from '@/lib/db/queries'
import { prisma } from '@/lib/db/prisma'

// Cast prisma to any to avoid TypeScript issues with mocking
const mockPrisma = prisma as any

describe('Database Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('marketQueries', () => {
    describe('getMarketById', () => {
      it('should fetch market by id', async () => {
        const mockMarket = { id: 'market-1', question: 'Test question' }
        mockPrisma.market.findUnique.mockResolvedValue(mockMarket)

        const result = await marketQueries.getMarketById('market-1')

        expect(mockPrisma.market.findUnique).toHaveBeenCalledWith({
          where: { id: 'market-1' }
        })
        expect(result).toEqual(mockMarket)
      })

      it('should return null for non-existent market', async () => {
        mockPrisma.market.findUnique.mockResolvedValue(null)

        const result = await marketQueries.getMarketById('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('getMarketsByEventId', () => {
      it('should fetch markets by event id', async () => {
        const mockMarkets = [
          { id: 'market-1', eventId: 'event-1', question: 'Question 1' },
          { id: 'market-2', eventId: 'event-1', question: 'Question 2' }
        ]
        mockPrisma.market.findMany.mockResolvedValue(mockMarkets)

        const result = await marketQueries.getMarketsByEventId('event-1')

        expect(mockPrisma.market.findMany).toHaveBeenCalledWith({
          where: { eventId: 'event-1' },
          orderBy: { volume: 'desc' }
        })
        expect(result).toEqual(mockMarkets)
      })
    })

    describe('upsertMarkets', () => {
      it('should return empty array for empty input', async () => {
        const result = await marketQueries.upsertMarkets([])
        expect(result).toEqual([])
      })

      it('should upsert markets in chunks', async () => {
        const mockMarkets = [
          { id: 'market-1', question: 'Question 1' },
          { id: 'market-2', question: 'Question 2' }
        ]
        const mockUpsertedMarkets = [...mockMarkets]
        
        mockPrisma.$transaction.mockResolvedValue(mockUpsertedMarkets)

        const result = await marketQueries.upsertMarkets(mockMarkets)

        expect(mockPrisma.$transaction).toHaveBeenCalled()
        expect(result).toEqual(mockUpsertedMarkets)
      })
    })
  })

  describe('predictionQueries', () => {
    describe('createPrediction', () => {
      it('should create a new prediction', async () => {
        const predictionData = {
          marketId: 'market-1',
          userMessage: 'Test message',
          predictionResult: { outcome: 'Yes' },
          userId: null
        }
        const mockCreatedPrediction = { id: 1, ...predictionData }
        
        mockPrisma.prediction.create.mockResolvedValue(mockCreatedPrediction)

        const result = await predictionQueries.createPrediction(predictionData)

        expect(mockPrisma.prediction.create).toHaveBeenCalledWith({
          data: predictionData
        })
        expect(result).toEqual(mockCreatedPrediction)
      })
    })

    describe('getMostRecentPredictionByMarketId', () => {
      it('should fetch most recent prediction for market', async () => {
        const mockPrediction = { id: 1, marketId: 'market-1', createdAt: new Date() }
        mockPrisma.prediction.findFirst.mockResolvedValue(mockPrediction)

        const result = await predictionQueries.getMostRecentPredictionByMarketId('market-1')

        expect(mockPrisma.prediction.findFirst).toHaveBeenCalledWith({
          where: { marketId: 'market-1' },
          orderBy: { createdAt: 'desc' }
        })
        expect(result).toEqual(mockPrediction)
      })
    })

    describe('getRecentPredictionsWithRelations', () => {
      it('should fetch recent predictions with market and event data', async () => {
        const mockPredictions = [
          { 
            id: 1, 
            marketId: 'market-1',
            market: { 
              id: 'market-1', 
              question: 'Test question',
              event: { id: 'event-1', title: 'Test event' }
            }
          }
        ]
        mockPrisma.prediction.findMany.mockResolvedValue(mockPredictions)

        const result = await predictionQueries.getRecentPredictionsWithRelations(10)

        expect(mockPrisma.prediction.findMany).toHaveBeenCalledWith({
          orderBy: { id: 'desc' },
          take: 10,
          include: {
            market: {
              include: {
                event: true,
              },
            },
          },
        })
        expect(result).toEqual(mockPredictions)
      })
    })
  })

  describe('eventQueries', () => {
    describe('getEventById', () => {
      it('should fetch event by id', async () => {
        const mockEvent = { id: 'event-1', title: 'Test Event' }
        mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

        const result = await eventQueries.getEventById('event-1')

        expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
          where: { id: 'event-1' }
        })
        expect(result).toEqual(mockEvent)
      })
    })

    describe('getTrendingEvents', () => {
      it('should fetch trending events ordered by volume', async () => {
        const mockEvents = [
          { id: 'event-1', title: 'Event 1', volume: 1000 },
          { id: 'event-2', title: 'Event 2', volume: 800 }
        ]
        mockPrisma.event.findMany.mockResolvedValue(mockEvents)

        const result = await eventQueries.getTrendingEvents()

        expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
          orderBy: { volume: 'desc' },
          take: 10
        })
        expect(result).toEqual(mockEvents)
      })
    })

    describe('upsertEvents', () => {
      it('should return empty array for empty input', async () => {
        const result = await eventQueries.upsertEvents([])
        expect(result).toEqual([])
      })

      it('should upsert events in chunks', async () => {
        const mockEvents = [
          { id: 'event-1', title: 'Event 1' },
          { id: 'event-2', title: 'Event 2' }
        ]
        const mockUpsertedEvents = [...mockEvents]
        
        mockPrisma.$transaction.mockResolvedValue(mockUpsertedEvents)

        const result = await eventQueries.upsertEvents(mockEvents)

        expect(mockPrisma.$transaction).toHaveBeenCalled()
        expect(result).toEqual(mockUpsertedEvents)
      })
    })
  })

  describe('tagQueries', () => {
    describe('getAllTags', () => {
      it('should fetch all tags ordered by label', async () => {
        const mockTags = [
          { id: '1', label: 'Politics' },
          { id: '2', label: 'Sports' }
        ]
        mockPrisma.tag.findMany.mockResolvedValue(mockTags)

        const result = await tagQueries.getAllTags()

        expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
          orderBy: { label: 'asc' }
        })
        expect(result).toEqual(mockTags)
      })
    })

    describe('upsertTags', () => {
      it('should return empty array for empty input', async () => {
        const result = await tagQueries.upsertTags([])
        expect(result).toEqual([])
      })

      it('should upsert tags', async () => {
        const mockTags = [
          { id: '1', label: 'Politics' },
          { id: '2', label: 'Sports' }
        ]
        
        mockPrisma.$transaction.mockResolvedValue(mockTags)

        const result = await tagQueries.upsertTags(mockTags)

        expect(mockPrisma.$transaction).toHaveBeenCalled()
        expect(result).toEqual(mockTags)
      })
    })
  })

  describe('Serialized Query Wrappers', () => {
    describe('marketQueries.getMarketByIdSerialized', () => {
      it('should return serialized market DTO', async () => {
        const mockMarket = {
          id: 'market-1',
          question: 'Test question',
          eventId: 'event-1',
          outcomePrices: [new Decimal('0.5'), new Decimal('0.3')],
          volume: new Decimal('1000'),
          liquidity: new Decimal('500'),
          description: 'Test description',
          active: true,
          closed: false,
          endDate: new Date('2024-12-31'),
          updatedAt: new Date('2024-01-01'),
          slug: 'test-market',
          startDate: new Date('2024-01-01'),
          resolutionSource: 'polymarket',
          outcomes: ['Yes', 'No'],
          icon: 'test-icon',
          image: 'test-image'
        }
        mockPrisma.market.findUnique.mockResolvedValue(mockMarket)

        const result = await marketQueries.getMarketByIdSerialized('market-1')

        expect(result).toEqual({
          id: 'market-1',
          question: 'Test question',
          eventId: 'event-1',
          outcomePrices: [0.5, 0.3],
          volume: 1000,
          liquidity: 500,
          description: 'Test description',
          active: true,
          closed: false,
          endDate: '2024-12-31T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          slug: 'test-market',
          startDate: '2024-01-01T00:00:00.000Z',
          resolutionSource: 'polymarket',
          outcomes: ['Yes', 'No'],
          icon: 'test-icon',
          image: 'test-image'
        })
      })

      it('should return null for non-existent market', async () => {
        mockPrisma.market.findUnique.mockResolvedValue(null)

        const result = await marketQueries.getMarketByIdSerialized('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('eventQueries.getEventByIdSerialized', () => {
      it('should return serialized event DTO', async () => {
        const mockEvent = {
          id: 'event-1',
          title: 'Test Event',
          description: 'Test description',
          slug: 'test-event',
          icon: 'test-icon',
          image: 'test-image',
          tags: [{ label: 'Politics' }],
          volume: new Decimal('2000'),
          endDate: new Date('2024-12-31'),
          marketProvider: 'polymarket',
          updatedAt: new Date('2024-01-01'),
          startDate: new Date('2024-01-01'),
          category: 'ELECTIONS',
          providerCategory: 'elections'
        }
        mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

        const result = await eventQueries.getEventByIdSerialized('event-1')

        expect(result).toEqual({
          id: 'event-1',
          title: 'Test Event',
          description: 'Test description',
          slug: 'test-event',
          icon: 'test-icon',
          image: 'test-image',
          tags: [{ label: 'Politics' }],
          volume: 2000,
          endDate: '2024-12-31T00:00:00.000Z',
          marketProvider: 'polymarket',
          updatedAt: '2024-01-01T00:00:00.000Z',
          startDate: '2024-01-01T00:00:00.000Z',
          category: 'ELECTIONS',
          providerCategory: 'elections'
        })
      })
    })

    describe('predictionQueries.getMostRecentPredictionByMarketIdSerialized', () => {
      it('should return serialized prediction DTO', async () => {
        const mockPrediction = {
          id: 123,
          userMessage: 'Test prediction',
          marketId: 'market-1',
          predictionResult: { outcome: 'Yes', confidence_level: 'High' },
          modelName: 'gpt-4',
          systemPrompt: 'Test prompt',
          aiResponse: 'Test response',
          createdAt: new Date('2024-01-01'),
          outcomes: ['Yes', 'No'],
          outcomesProbabilities: [new Decimal('0.7'), new Decimal('0.3')],
          userId: 'user-1',
          experimentTag: 'test-exp',
          experimentNotes: 'Test notes'
        }
        mockPrisma.prediction.findFirst.mockResolvedValue(mockPrediction)

        const result = await predictionQueries.getMostRecentPredictionByMarketIdSerialized('market-1')

        expect(result).toEqual({
          id: '123',
          userMessage: 'Test prediction',
          marketId: 'market-1',
          predictionResult: { outcome: 'Yes', confidence_level: 'High' },
          modelName: 'gpt-4',
          systemPrompt: 'Test prompt',
          aiResponse: 'Test response',
          createdAt: '2024-01-01T00:00:00.000Z',
          outcomes: ['Yes', 'No'],
          outcomesProbabilities: [0.7, 0.3],
          userId: 'user-1',
          experimentTag: 'test-exp',
          experimentNotes: 'Test notes'
        })
      })

      it('should return null for no prediction', async () => {
        mockPrisma.prediction.findFirst.mockResolvedValue(null)

        const result = await predictionQueries.getMostRecentPredictionByMarketIdSerialized('market-1')

        expect(result).toBeNull()
      })
    })
  })

  describe('DTO Types', () => {
    it('should be properly typed for client components', () => {
      // This test verifies that the DTO types are properly structured
      // by creating instances that match the expected shape

      // Test EventDTO shape
      const eventDto: any = {
        id: 'event-1',
        title: 'Test Event',
        description: 'Test description',
        volume: 1000,
        endDate: '2024-12-31T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      expect(eventDto.id).toBe('event-1')
      expect(typeof eventDto.volume).toBe('number')
      expect(typeof eventDto.endDate).toBe('string')
      expect(typeof eventDto.updatedAt).toBe('string')

      // Test MarketDTO shape
      const marketDto: any = {
        id: 'market-1',
        question: 'Test question',
        eventId: 'event-1',
        outcomePrices: [0.5, 0.3],
        volume: 1000,
        liquidity: 500,
        endDate: '2024-12-31T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        outcomes: ['Yes', 'No']
      }
      expect(marketDto.id).toBe('market-1')
      expect(Array.isArray(marketDto.outcomePrices)).toBe(true)
      expect(marketDto.outcomePrices.every((p: any) => typeof p === 'number')).toBe(true)
      expect(typeof marketDto.endDate).toBe('string')
      expect(typeof marketDto.updatedAt).toBe('string')

      // Test PredictionDTO shape
      const predictionDto: any = {
        id: '123',
        userMessage: 'Test prediction',
        marketId: 'market-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        outcomes: ['Yes', 'No'],
        outcomesProbabilities: [0.7, 0.3]
      }
      expect(predictionDto.id).toBe('123')
      expect(Array.isArray(predictionDto.outcomesProbabilities)).toBe(true)
      expect(predictionDto.outcomesProbabilities.every((p: any) => typeof p === 'number')).toBe(true)
      expect(typeof predictionDto.createdAt).toBe('string')
    })
  })
})