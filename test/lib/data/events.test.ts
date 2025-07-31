// Mock modules before importing
jest.mock('@/lib/db', () => ({
  db: {
    query: {
      events: {
        findMany: jest.fn(),
        findFirst: jest.fn()
      },
      markets: {
        findMany: jest.fn(),
        findFirst: jest.fn()
      }
    },
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn()
  }
}))

jest.mock('@/lib/polymarket', () => ({
  getEventById: jest.fn()
}))

import { 
  getTrendingEvents, 
  getTrendingEventsWithMarkets, 
  getEventById, 
  getEventBySlug, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  updateEventIcon, 
  updateTrendingEvents 
} from '@/lib/data/events'
import { db } from '@/lib/db'
import { getEventById as getPolymarketEvent } from '@/lib/polymarket'

const mockDb = db as any
const mockGetPolymarketEvent = getPolymarketEvent as jest.MockedFunction<typeof getPolymarketEvent>

describe('Events Data Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTrendingEvents', () => {
    it('should return trending events ordered by trending rank', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', trendingRank: 3 },
        { id: '2', title: 'Event 2', trendingRank: 2 },
        { id: '3', title: 'Event 3', trendingRank: 1 }
      ]

      mockDb.query.events.findMany.mockResolvedValue(mockEvents)

      const result = await getTrendingEvents()

      expect(result).toEqual(mockEvents)
      expect(mockDb.query.events.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Function),
        limit: 10
      })
    })

    it('should return empty array when no trending events exist', async () => {
      mockDb.query.events.findMany.mockResolvedValue([])

      const result = await getTrendingEvents()

      expect(result).toEqual([])
    })
  })

  describe('getTrendingEventsWithMarkets', () => {
    it('should return trending events with their markets', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', trendingRank: 3 },
        { id: '2', title: 'Event 2', trendingRank: 2 }
      ]

      const mockMarkets = [
        { id: 'm1', eventId: '1', question: 'Market 1', volume: 1000 },
        { id: 'm2', eventId: '1', question: 'Market 2', volume: 500 },
        { id: 'm3', eventId: '2', question: 'Market 3', volume: 750 }
      ]

      mockDb.query.events.findMany.mockResolvedValue(mockEvents)
      mockDb.query.markets.findMany.mockResolvedValue(mockMarkets)

      const result = await getTrendingEventsWithMarkets()

      expect(result).toEqual([
        {
          ...mockEvents[0],
          markets: [mockMarkets[0], mockMarkets[1]]
        },
        {
          ...mockEvents[1],
          markets: [mockMarkets[2]]
        }
      ])
    })

    it('should return events with empty markets array when no markets exist', async () => {
      const mockEvents = [{ id: '1', title: 'Event 1', trendingRank: 3 }]
      
      mockDb.query.events.findMany.mockResolvedValue(mockEvents)
      mockDb.query.markets.findMany.mockResolvedValue([])

      const result = await getTrendingEventsWithMarkets()

      expect(result).toEqual([
        { ...mockEvents[0], markets: [] }
      ])
    })
  })

  describe('getEventById', () => {
    it('should return event when found', async () => {
      const mockEvent = { id: '1', title: 'Test Event' }
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent)

      const result = await getEventById('1')

      expect(result).toEqual(mockEvent)
      expect(mockDb.query.events.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function)
      })
    })

    it('should return null when event not found', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(null)

      const result = await getEventById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getEventBySlug', () => {
    it('should return event when found by slug', async () => {
      const mockEvent = { id: '1', title: 'Test Event', slug: 'test-event' }
      mockDb.query.events.findFirst.mockResolvedValue(mockEvent)

      const result = await getEventBySlug('test-event')

      expect(result).toEqual(mockEvent)
      expect(mockDb.query.events.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function)
      })
    })

    it('should return null when event not found by slug', async () => {
      mockDb.query.events.findFirst.mockResolvedValue(null)

      const result = await getEventBySlug('nonexistent-slug')

      expect(result).toBeNull()
    })
  })

  describe('createEvent', () => {
    it('should create and return new event', async () => {
      const eventData = { id: '1', title: 'New Event', description: 'Test description' }
      const createdEvent = { ...eventData, createdAt: new Date() }
      
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEvent])
        })
      } as any)

      const result = await createEvent(eventData)

      expect(result).toEqual(createdEvent)
    })
  })

  describe('updateEvent', () => {
    it('should update and return event', async () => {
      const updateData = { title: 'Updated Event' }
      const updatedEvent = { id: '1', title: 'Updated Event', updatedAt: new Date() }
      
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const result = await updateEvent('1', updateData)

      expect(result).toEqual(updatedEvent)
    })

    it('should return null when event not found for update', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      } as any)

      const result = await updateEvent('nonexistent', { title: 'Updated' })

      expect(result).toBeNull()
    })
  })

  describe('deleteEvent', () => {
    it('should return true when event is deleted', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 })
      } as any)

      const result = await deleteEvent('1')

      expect(result).toBe(true)
    })

    it('should return false when event not found for deletion', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 })
      } as any)

      const result = await deleteEvent('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('updateEventIcon', () => {
    it('should update event icon from Polymarket data', async () => {
      const polymarketEvent = { 
        id: '1', 
        title: 'Test Event',
        description: 'Test description',
        slug: 'test-event',
        icon: 'https://example.com/icon.png',
        tags: [],
        endDate: '2024-12-31',
        volume: 1000000,
        markets: []
      }
      const updatedEvent = { id: '1', title: 'Event', icon: 'https://example.com/icon.png' }
      
      mockGetPolymarketEvent.mockResolvedValue(polymarketEvent)
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const result = await updateEventIcon('1')

      expect(result).toEqual(updatedEvent)
      expect(mockGetPolymarketEvent).toHaveBeenCalledWith('1')
    })

    it('should return null when Polymarket event not found', async () => {
      mockGetPolymarketEvent.mockResolvedValue(null)

      const result = await updateEventIcon('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null when error occurs', async () => {
      mockGetPolymarketEvent.mockRejectedValue(new Error('API Error'))

      const result = await updateEventIcon('1')

      expect(result).toBeNull()
    })
  })

  describe('updateTrendingEvents', () => {
    it('should execute trending update query', async () => {
      mockDb.execute.mockResolvedValue({} as any)

      await updateTrendingEvents()

      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('UPDATE events'))
    })
  })
}) 