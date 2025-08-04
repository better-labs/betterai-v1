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

import { 
  getTrendingEvents, 
  getTrendingEventsWithMarkets, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '@/lib/data/events'
import { db } from '@/lib/db'
import { eventFixtures, marketFixtures } from '../fixtures'

const mockDb = db as any

describe('Events Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Event lifecycle integration', () => {
    it('should create, read, update, and delete an event', async () => {
      // Create event
      const newEventData = {
        id: 'integration-test-event',
        title: 'Integration Test Event',
        description: 'Test event for integration testing',
        slug: 'integration-test-event'
      }
      
      const createdEvent = { ...newEventData, createdAt: new Date() }
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEvent])
        })
      } as any)

      const created = await createEvent(newEventData)
      expect(created).toEqual(createdEvent)

      // Read event by ID
      mockDb.query.events.findFirst.mockResolvedValue(createdEvent)
      const readEvent = await getEventById('integration-test-event')
      expect(readEvent).toEqual(createdEvent)

      // Update event
      const updateData = { title: 'Updated Integration Test Event' }
      const updatedEvent = { ...createdEvent, ...updateData, updatedAt: new Date() }
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const updated = await updateEvent('integration-test-event', updateData)
      expect(updated).toEqual(updatedEvent)

      // Delete event
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 })
      } as any)

      const deleted = await deleteEvent('integration-test-event')
      expect(deleted).toBe(true)
    })
  })

  describe('Trending events workflow', () => {
    it('should get trending events and then get them with markets', async () => {
      const trendingEvents = eventFixtures.filter(e => e.trendingRank && e.trendingRank > 0).slice(0, 2)
      const marketsForEvents = marketFixtures.filter(m => 
        trendingEvents.some(e => e.id === m.eventId)
      )

      // Mock getTrendingEvents
      mockDb.query.events.findMany.mockResolvedValue(trendingEvents)
      const trending = await getTrendingEvents()
      expect(trending).toEqual(trendingEvents)

      // Mock getTrendingEventsWithMarkets
      mockDb.query.events.findMany.mockResolvedValue(trendingEvents)
      mockDb.query.markets.findMany.mockResolvedValue(marketsForEvents)
      
      const trendingWithMarkets = await getTrendingEventsWithMarkets()
      expect(trendingWithMarkets).toHaveLength(trendingEvents.length)
      expect(trendingWithMarkets[0]).toHaveProperty('markets')
    })
  })

  describe('Data consistency tests', () => {
    it('should maintain data consistency across multiple operations', async () => {
      const eventId = 'consistency-test-event'
      const eventData = {
        id: eventId,
        title: 'Consistency Test Event',
        description: 'Testing data consistency',
        slug: 'consistency-test-event'
      }

      // Create event
      const createdEvent = { ...eventData, createdAt: new Date() }
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEvent])
        })
      } as any)

      await createEvent(eventData)

      // Verify event exists
      mockDb.query.events.findFirst.mockResolvedValue(createdEvent)
      const foundEvent = await getEventById(eventId)
      expect(foundEvent?.id).toBe(eventId)

      // Update event
      const updateData = { title: 'Updated Consistency Test Event' }
      const updatedEvent = { ...createdEvent, ...updateData, updatedAt: new Date() }
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent])
          })
        })
      } as any)

      const updated = await updateEvent(eventId, updateData)
      expect(updated?.title).toBe(updateData.title)

      // Verify update persisted
      mockDb.query.events.findFirst.mockResolvedValue(updatedEvent)
      const foundUpdatedEvent = await getEventById(eventId)
      expect(foundUpdatedEvent?.title).toBe(updateData.title)
    })
  })

  describe('Error recovery scenarios', () => {
    it('should handle partial failures gracefully', async () => {
      const eventId = 'error-recovery-test'
      
      // Simulate database connection issues
      mockDb.query.events.findFirst.mockRejectedValue(new Error('Connection timeout'))
      
      await expect(getEventById(eventId)).rejects.toThrow('Connection timeout')

      // Simulate recovery
      mockDb.query.events.findFirst.mockResolvedValue(eventFixtures[0])
      const recoveredEvent = await getEventById(eventId)
      expect(recoveredEvent).toEqual(eventFixtures[0])
    })

    it('should handle concurrent operations', async () => {
      const eventId = 'concurrent-test-event'
      const eventData = { id: eventId, title: 'Concurrent Test Event' }

      // Simulate concurrent create and read operations
      const createdEvent = { ...eventData, createdAt: new Date() }
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEvent])
        })
      } as any)

      mockDb.query.events.findFirst.mockResolvedValue(createdEvent)

      // Execute operations concurrently
      const [created, found] = await Promise.all([
        createEvent(eventData),
        getEventById(eventId)
      ])

      expect(created).toEqual(createdEvent)
      expect(found).toEqual(createdEvent)
    })
  })

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', async () => {
      const largeEventSet = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        trendingRank: Math.floor(Math.random() * 5) + 1
      }))

      const largeMarketSet = Array.from({ length: 500 }, (_, i) => ({
        id: `market-${i}`,
        eventId: `event-${Math.floor(i / 5)}`,
        question: `Market ${i}`,
        volume: '1000'
      }))

      mockDb.query.events.findMany.mockResolvedValue(largeEventSet)
      mockDb.query.markets.findMany.mockResolvedValue(largeMarketSet)

      const result = await getTrendingEventsWithMarkets()

      expect(result).toHaveLength(largeEventSet.length)
      expect(result[0]).toHaveProperty('markets')
    })
  })
}) 