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
  getTrendingEventsWithMarkets, 
  updateEventIcon, 
  updateEvent, 
  deleteEvent 
} from '@/lib/data/events'
import { db } from '@/lib/db'
import { getEventById as getPolymarketEvent } from '@/lib/polymarket'
import { eventFixtures, marketFixtures, polymarketEventFixtures } from '../fixtures'

const mockDb = db as any
const mockGetPolymarketEvent = getPolymarketEvent as jest.MockedFunction<typeof getPolymarketEvent>

describe('Events Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTrendingEventsWithMarkets edge cases', () => {
    it('should handle events with no markets gracefully', async () => {
      const eventsWithNoMarkets = eventFixtures.slice(0, 2)
      const emptyMarkets: typeof marketFixtures = []
      
      mockDb.query.events.findMany.mockResolvedValue(eventsWithNoMarkets)
      mockDb.query.markets.findMany.mockResolvedValue(emptyMarkets)

      const result = await getTrendingEventsWithMarkets()

      expect(result).toEqual([
        { ...eventsWithNoMarkets[0], markets: [] },
        { ...eventsWithNoMarkets[1], markets: [] }
      ])
    })

    it('should handle markets with null eventId', async () => {
      const events = eventFixtures.slice(0, 1)
      const marketsWithNullEventId = [
        { ...marketFixtures[0], eventId: null },
        { ...marketFixtures[1], eventId: 'event-1' }
      ]
      
      mockDb.query.events.findMany.mockResolvedValue(events)
      mockDb.query.markets.findMany.mockResolvedValue(marketsWithNullEventId)

      const result = await getTrendingEventsWithMarkets()

      expect(result).toEqual([
        { ...events[0], markets: [marketsWithNullEventId[1]] }
      ])
    })

    it('should handle database query errors', async () => {
      mockDb.query.events.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(getTrendingEventsWithMarkets()).rejects.toThrow('Database connection failed')
    })
  })

  describe('updateEventIcon edge cases', () => {
    it('should handle Polymarket API timeout', async () => {
      mockGetPolymarketEvent.mockRejectedValue(new Error('Request timeout'))

      const result = await updateEventIcon('event-1')

      expect(result).toBeNull()
    })

    it('should handle invalid event ID format', async () => {
      const result = await updateEventIcon('invalid-event-id')

      expect(result).toBeNull()
    })

    it('should handle database update failure', async () => {
      const polymarketEvent = polymarketEventFixtures[0]
      mockGetPolymarketEvent.mockResolvedValue(polymarketEvent)
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Update failed'))
          })
        })
      } as any)

      const result = await updateEventIcon('event-1')

      expect(result).toBeNull()
    })

    it('should handle empty icon URL from Polymarket', async () => {
      const polymarketEvent = { ...polymarketEventFixtures[0], icon: '' }
      mockGetPolymarketEvent.mockResolvedValue(polymarketEvent)
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...eventFixtures[0], icon: '' }])
          })
        })
      } as any)

      const result = await updateEventIcon('event-1')

      expect(result).toEqual({ ...eventFixtures[0], icon: '' })
    })
  })

  describe('updateEvent edge cases', () => {
    it('should handle partial updates with empty fields', async () => {
      const updateData = { title: '', description: undefined }
      const updatedEvent = { ...eventFixtures[0], title: '', updatedAt: new Date() }
      
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const result = await updateEvent('event-1', updateData)

      expect(result).toEqual(updatedEvent)
    })

    it('should handle update with only updatedAt field', async () => {
      const updateData = {}
      const updatedEvent = { ...eventFixtures[0], updatedAt: new Date() }
      
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const result = await updateEvent('event-1', updateData)

      expect(result).toEqual(updatedEvent)
    })

    it('should handle database constraint violations', async () => {
      const updateData = { slug: 'duplicate-slug' }
      
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Unique constraint violation'))
          })
        })
      } as any)

      await expect(updateEvent('event-1', updateData)).rejects.toThrow('Unique constraint violation')
    })
  })

  describe('deleteEvent edge cases', () => {
    it('should handle deletion of non-existent event', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 })
      } as any)

      const result = await deleteEvent('non-existent-event')

      expect(result).toBe(false)
    })

    it('should handle database deletion errors', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Deletion failed'))
      } as any)

      await expect(deleteEvent('event-1')).rejects.toThrow('Deletion failed')
    })

    it('should handle foreign key constraint violations', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Foreign key constraint violation'))
      } as any)

      await expect(deleteEvent('event-1')).rejects.toThrow('Foreign key constraint violation')
    })
  })

  describe('Error handling patterns', () => {
    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetPolymarketEvent.mockRejectedValue(new Error('API Error'))

      await updateEventIcon('event-1')

      expect(consoleSpy).toHaveBeenCalledWith('Error updating event icon:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should log warnings for missing Polymarket events', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockGetPolymarketEvent.mockResolvedValue(null)

      await updateEventIcon('event-1')

      expect(consoleSpy).toHaveBeenCalledWith('Event not found in Polymarket: event-1')
      consoleSpy.mockRestore()
    })
  })
}) 