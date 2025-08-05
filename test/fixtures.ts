import type { Event, Market, PolymarketEvent } from '@/lib/types'

// Test fixtures for events
export const eventFixtures: Event[] = [
  {
    id: 'event-1',
    title: 'Will Bitcoin reach $100k by end of 2024?',
    description: 'Prediction market for Bitcoin price target',
    slug: 'bitcoin-100k-2024',
    icon: 'https://example.com/bitcoin-icon.png',
    tags: [{ id: 'crypto', label: 'Cryptocurrency', slug: 'crypto', forceShow: true, updatedAt: '2024-01-01' }],
    category: 1,
    volume: '5000000',
    trendingRank: 5,
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-12-31T23:59:59Z'),
    marketProvider: 'polymarket',
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'event-2',
    title: 'Will Trump win the 2024 election?',
    description: 'Presidential election prediction market',
    slug: 'trump-2024-election',
    icon: 'https://example.com/politics-icon.png',
    tags: [{ id: 'politics', label: 'Politics', slug: 'politics', forceShow: true, updatedAt: '2024-01-01' }],
    category: 2,
    volume: '3000000',
    trendingRank: 4,
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-11-05T23:59:59Z'),
    marketProvider: 'polymarket',
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'event-3',
    title: 'Will Apple release a new iPhone in September?',
    description: 'Apple product launch prediction',
    slug: 'apple-iphone-september-2024',
    icon: 'https://example.com/tech-icon.png',
    tags: [{ id: 'tech', label: 'Technology', slug: 'tech', forceShow: true, updatedAt: '2024-01-01' }],
    category: 3,
    volume: '1000000',
    trendingRank: 2,
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-09-30T23:59:59Z'),
    marketProvider: 'polymarket',
    updatedAt: new Date('2024-01-15T10:00:00Z')
  }
]

// Test fixtures for markets
export const marketFixtures: Market[] = [
  {
    id: 'market-1',
    question: 'Will Bitcoin reach $100k by end of 2024?',
    description: null,
    eventId: 'event-1',
    slug: null,
    outcomePrices: ['0.65', '0.35'],
    outcomes: ['Yes', 'No'],
    volume: '5000000',
    liquidity: '2500000',
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'market-2',
    question: 'Will Bitcoin reach $150k by end of 2024?',
    description: null,
    eventId: 'event-1',
    slug: null,
    outcomePrices: ['0.25', '0.75'],
    outcomes: ['Yes', 'No'],
    volume: '2000000',
    liquidity: '1000000',
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'market-3',
    question: 'Will Trump win the 2024 election?',
    description: null,
    eventId: 'event-2',
    slug: null,
    outcomePrices: ['0.45', '0.55'],
    outcomes: ['Yes', 'No'],
    volume: '3000000',
    liquidity: '1500000',
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'market-4',
    question: 'Will Apple release a new iPhone in September?',
    description: null,
    eventId: 'event-3',
    slug: null,
    outcomePrices: ['0.80', '0.20'],
    outcomes: ['Yes', 'No'],
    volume: '1000000',
    liquidity: '500000',
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date('2024-01-15T10:00:00Z')
  }
]

// Helper functions to get fixtures by criteria
export const getEventById = (id: string): Event | undefined => 
  eventFixtures.find(event => event.id === id)

export const getEventBySlug = (slug: string): Event | undefined => 
  eventFixtures.find(event => event.slug === slug)

export const getMarketsByEventId = (eventId: string): Market[] => 
  marketFixtures.filter(market => market.eventId === eventId)

export const getTrendingEvents = (): Event[] => 
  eventFixtures.filter(event => event.trendingRank && event.trendingRank > 0).sort((a, b) => (b.trendingRank || 0) - (a.trendingRank || 0)) 