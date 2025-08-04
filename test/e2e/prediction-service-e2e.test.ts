import { generatePredictionForMarket } from '@/lib/services/prediction-service'
import { marketQueries, predictionQueries } from '@/lib/db/queries'
import type { Market, PredictionResult } from '@/lib/types'

describe('Prediction Service E2E Tests', () => {
  let testMarket: Market | null = null
  let initialPredictionCount = 0

  beforeAll(async () => {
    // Get initial prediction count
    const recentPredictions = await predictionQueries.getRecentPredictions(1000)
    initialPredictionCount = recentPredictions.length

    // Get a random market from the database
    const topMarkets = await marketQueries.getTopMarkets(10)
    if (topMarkets.length === 0) {
      throw new Error('No markets found in database for testing')
    }
    
    // Pick a random market from the top 10
    const randomIndex = Math.floor(Math.random() * Math.min(topMarkets.length, 10))
    testMarket = topMarkets[randomIndex]
    
    console.log(`Selected test market: ${testMarket.question}`)
  })

  afterAll(async () => {
    // Clean up: delete the test prediction we created
    const recentPredictions = await predictionQueries.getRecentPredictions(1000)
    const testPrediction = recentPredictions.find(p => p.marketId === testMarket?.id)
    
    if (testPrediction) {
      // Note: We don't have a deletePrediction function, so we'll just verify the count
      console.log(`Test prediction created with ID: ${testPrediction.id}`)
    }
  })

  describe('generatePredictionForMarket E2E', () => {
    it('should generate a real prediction and save it to the database', async () => {
      if (!testMarket) {
        throw new Error('No test market available')
      }

      console.log(`\n🧪 Starting E2E test for market: "${testMarket.question}"`)
      console.log(`📊 Market ID: ${testMarket.id}`)
      console.log(`📈 Initial prediction count: ${initialPredictionCount}`)

      // Generate prediction using real market from database
      const result = await generatePredictionForMarket(testMarket.id)

      // Verify the result structure
      expect(result.success).toBe(true)
      expect(result.message).toContain('Successfully generated and saved prediction')
      expect(result.predictionId).toBeDefined()
      expect(result.prediction).toBeDefined()

      // Verify prediction structure
      expect(result.prediction).toHaveProperty('prediction')
      expect(result.prediction).toHaveProperty('probability')
      expect(result.prediction).toHaveProperty('reasoning')
      expect(result.prediction).toHaveProperty('confidence_level')

      // Verify prediction data types
      expect(typeof result.prediction!.prediction).toBe('string')
      expect(typeof result.prediction!.probability).toBe('number')
      expect(typeof result.prediction!.reasoning).toBe('string')
      expect(['High', 'Medium', 'Low']).toContain(result.prediction!.confidence_level)

      // Verify probability is within valid range
      expect(result.prediction!.probability).toBeGreaterThanOrEqual(0)
      expect(result.prediction!.probability).toBeLessThanOrEqual(1)

      console.log(`✅ Prediction generated successfully!`)
      console.log(`📝 Prediction: ${result.prediction!.prediction}`)
      console.log(`📊 Probability: ${result.prediction!.probability}`)
      console.log(`🎯 Confidence: ${result.prediction!.confidence_level}`)

      // Verify that a new database record was actually created
      const updatedPredictions = await predictionQueries.getRecentPredictions(1000)
      const newPredictionCount = updatedPredictions.length
      
      console.log(`📈 Updated prediction count: ${newPredictionCount}`)
      console.log(`📊 Net change: +${newPredictionCount - initialPredictionCount} predictions`)

      // Verify that the count increased by at least 1
      expect(newPredictionCount).toBeGreaterThanOrEqual(initialPredictionCount + 1)

      // Find our specific prediction in the database
      const createdPrediction = updatedPredictions.find(p => p.id === result.predictionId)
      expect(createdPrediction).toBeDefined()
      expect(createdPrediction!.marketId).toBe(testMarket.id)
      expect(createdPrediction!.userMessage).toBe(testMarket.question)

      console.log(`💾 Database record verified!`)
      console.log(`🆔 Prediction ID: ${createdPrediction!.id}`)
      console.log(`⏰ Created at: ${createdPrediction!.createdAt}`)
      console.log(`🤖 Model used: ${createdPrediction!.modelName}`)

      // Verify the stored prediction result matches what we received
      expect(createdPrediction!.predictionResult).toEqual(result.prediction)
    }, 30000) // 30 second timeout for API calls

    it('should handle market not found gracefully', async () => {
      const nonExistentMarketId = 'non-existent-market-id'
      
      const result = await generatePredictionForMarket(nonExistentMarketId)
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found in database')
      expect(result.predictionId).toBeUndefined()
      expect(result.prediction).toBeUndefined()
    })

    it('should handle empty market ID gracefully', async () => {
      const result = await generatePredictionForMarket('')
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Market ID is required')
      expect(result.predictionId).toBeUndefined()
      expect(result.prediction).toBeUndefined()
    })
  })

  describe('Database State Verification', () => {
    it('should verify database state after prediction creation', async () => {
      if (!testMarket) {
        throw new Error('No test market available')
      }

      // Get the most recent predictions
      const recentPredictions = await predictionQueries.getRecentPredictions(5)
      
      // Find predictions for our test market
      const marketPredictions = recentPredictions.filter(p => p.marketId === testMarket!.id)
      
      console.log(`\n🔍 Database verification:`)
      console.log(`📊 Total recent predictions: ${recentPredictions.length}`)
      console.log(`🎯 Predictions for test market: ${marketPredictions.length}`)
      
      if (marketPredictions.length > 0) {
        const latestPrediction = marketPredictions[0]
        const predictionResult = latestPrediction.predictionResult as PredictionResult
        console.log(`📝 Latest prediction: "${predictionResult.prediction}"`)
        console.log(`📊 Probability: ${predictionResult.probability}`)
        console.log(`🎯 Confidence: ${predictionResult.confidence_level}`)
      }

      // Verify we have at least one prediction for our test market
      expect(marketPredictions.length).toBeGreaterThan(0)
    })
  })
}) 