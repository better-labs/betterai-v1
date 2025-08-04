import { db } from '@/lib/db'
import { markets, predictions, events, type Market, type Prediction } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getMarketById } from '@/lib/data/markets'
import { getMostRecentPredictionByMarketId } from '@/lib/data/predictions'
import type { PredictionResult } from '@/lib/types'

describe('Market Detail Page', () => {
  const testMarketId = 'test-market-123'
  const testEventId = 'test-event-123'

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(predictions).where(eq(predictions.marketId, testMarketId))
    await db.delete(markets).where(eq(markets.id, testMarketId))
    await db.delete(events).where(eq(events.id, testEventId))

    // Insert test event first
    await db.insert(events).values({
      id: testEventId,
      title: 'Test Event',
      description: 'A test event for unit testing',
      slug: 'test-event',
      volume: '0'
    })

    // Insert test market
    await db.insert(markets).values({
      id: testMarketId,
      question: 'Will the test market resolve to Yes?',
      description: 'A test market for unit testing',
      eventId: testEventId,
      volume: '10000',
      liquidity: '5000',
      active: true,
      endDate: new Date('2025-12-31')
    })

    // Insert test prediction
    await db.insert(predictions).values({
      marketId: testMarketId,
      userMessage: 'Test prediction request',
      predictionResult: {
        prediction: 'Yes',
        probability: 0.75,
        reasoning: 'Test reasoning for the prediction',
        confidence_level: 'High',

      },
      aiResponse: 'Test AI response'
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(predictions).where(eq(predictions.marketId, testMarketId))
    await db.delete(markets).where(eq(markets.id, testMarketId))
    await db.delete(events).where(eq(events.id, testEventId))
  })

  describe('getMarketById', () => {
    it('should return market data for valid market ID', async () => {
      const market = await getMarketById(testMarketId)
      
      expect(market).toBeDefined()
      expect(market?.id).toBe(testMarketId)
      expect(market?.question).toBe('Will the test market resolve to Yes?')
      expect(market?.volume).toBe('10000')
    })

    it('should return null for invalid market ID', async () => {
      const market = await getMarketById('invalid-market-id')
      expect(market).toBeNull()
    })
  })

  describe('getMostRecentPredictionByMarketId', () => {
    it('should return the most recent prediction for a market', async () => {
      const prediction = await getMostRecentPredictionByMarketId(testMarketId)
      
      expect(prediction).toBeDefined()
      expect(prediction?.marketId).toBe(testMarketId)
      
      const predictionResult = prediction?.predictionResult as PredictionResult
      expect(predictionResult.prediction).toBe('Yes')
      expect(predictionResult.probability).toBe(0.75)
      expect(predictionResult.confidence_level).toBe('High')
    })

    it('should return null for market with no predictions', async () => {
      const prediction = await getMostRecentPredictionByMarketId('market-with-no-predictions')
      expect(prediction).toBeNull()
    })
  })
}) 