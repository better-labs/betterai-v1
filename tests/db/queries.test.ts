import { describe, it, expect, vi, beforeEach } from 'vitest'

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
})