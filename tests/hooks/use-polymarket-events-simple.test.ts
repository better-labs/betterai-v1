import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPolymarketEvents } from '@/lib/services/polymarket-client'
import type { PolymarketEvent } from '@/lib/types'

// Mock the polymarket client
vi.mock('@/lib/services/polymarket-client', () => ({
  fetchPolymarketEvents: vi.fn(),
}))

describe('polymarket client integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockEvents: PolymarketEvent[] = [
    {
      id: '1',
      title: 'Test Event 1',
      description: 'Test description',
      slug: 'test-event-1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      image: 'https://example.com/image.jpg',
      icon: '🏆',
      volume: 1000000,
      liquidity: 500000,
      commentCount: 10,
      tags: [],
      markets: [],
      active: true,
      closed: false,
      archived: false,
      restricted: false
    }
  ]

  it('fetchPolymarketEvents returns data when mocked', async () => {
    vi.mocked(fetchPolymarketEvents).mockResolvedValueOnce(mockEvents)

    const result = await fetchPolymarketEvents(
      0, // offset
      50, // limit
      new Date('2024-01-01'), // startDateMin
      new Date('2024-12-31'), // endDateMax
      {
        limit: 50,
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 30000,
        userAgent: 'BetterAI/1.0'
      }
    )

    expect(result).toEqual(mockEvents)
    expect(fetchPolymarketEvents).toHaveBeenCalledWith(
      0,
      50,
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      {
        limit: 50,
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 30000,
        userAgent: 'BetterAI/1.0'
      }
    )
  })

  it('fetchPolymarketEvents handles errors', async () => {
    const errorMessage = 'API Error'
    vi.mocked(fetchPolymarketEvents).mockRejectedValueOnce(new Error(errorMessage))

    await expect(
      fetchPolymarketEvents(0, 50, new Date(), new Date(), {})
    ).rejects.toThrow(errorMessage)
  })

  it('fetchPolymarketEvents can be called with custom options', async () => {
    vi.mocked(fetchPolymarketEvents).mockResolvedValueOnce(mockEvents)

    await fetchPolymarketEvents(
      10, // custom offset
      25, // custom limit
      '2024-06-01', // string date
      '2024-12-31', // string date
      {
        maxRetries: 5,
        timeoutMs: 60000,
        userAgent: 'Custom/1.0'
      },
      'volume' // sortBy
    )

    expect(fetchPolymarketEvents).toHaveBeenCalledWith(
      10,
      25,
      '2024-06-01',
      '2024-12-31',
      {
        maxRetries: 5,
        timeoutMs: 60000,
        userAgent: 'Custom/1.0'
      },
      'volume'
    )
  })
})