import type { Event, Market, NewEvent } from '@/lib/types'

// Mock data factories
export const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'test-event-1',
  title: 'Test Event',
  description: 'Test event description',
  slug: 'test-event',
  icon: 'https://example.com/icon.png',
  tags: [],
  category: 1,
  volume: '1000000',
  trendingRank: 3,
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-12-31T23:59:59Z'),
  marketProvider: 'polymarket',
  updatedAt: new Date(),
  ...overrides
})

export const createMockMarket = (overrides: Partial<Market> = {}): Market => ({
  id: 'test-market-1',
  question: 'Will the event happen?',
  description: null,
  eventId: 'test-event-1',
  slug: null,
  outcomePrices: ['0.65', '0.35'],
  outcomes: ['Yes', 'No'],
  volume: '100000',
  liquidity: '50000',
  category: null,
  active: true,
  closed: false,
  startDate: null,
  endDate: null,
  resolutionSource: null,
  updatedAt: new Date(),
  ...overrides
})

export const createMockNewEvent = (overrides: Partial<NewEvent> = {}): NewEvent => ({
  id: 'new-event-1',
  title: 'New Event',
  description: 'New event description',
  slug: 'new-event',
  ...overrides
})

// Mock database response helpers
export const mockDbQuery = {
  events: {
    findMany: jest.fn(),
    findFirst: jest.fn()
  },
  markets: {
    findMany: jest.fn(),
    findFirst: jest.fn()
  }
}

export const mockDbOperations = {
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  execute: jest.fn()
}

// Test utilities
export const setupMockDb = () => {
  const mockDb = {
    query: mockDbQuery,
    insert: mockDbOperations.insert,
    update: mockDbOperations.update,
    delete: mockDbOperations.delete,
    execute: mockDbOperations.execute
  }
  
  return mockDb as any
}

export const resetMocks = () => {
  jest.clearAllMocks()
  Object.values(mockDbQuery.events).forEach(mock => mock.mockReset())
  Object.values(mockDbQuery.markets).forEach(mock => mock.mockReset())
  Object.values(mockDbOperations).forEach(mock => mock.mockReset())
}

// Common test data
export const mockEvents = [
  createMockEvent({ id: 'event-1', title: 'Event 1', trendingRank: 3 }),
  createMockEvent({ id: 'event-2', title: 'Event 2', trendingRank: 2 }),
  createMockEvent({ id: 'event-3', title: 'Event 3', trendingRank: 1 })
]

export const mockMarkets = [
  createMockMarket({ id: 'market-1', eventId: 'event-1', question: 'Market 1' }),
  createMockMarket({ id: 'market-2', eventId: 'event-1', question: 'Market 2' }),
  createMockMarket({ id: 'market-3', eventId: 'event-2', question: 'Market 3' })
] 