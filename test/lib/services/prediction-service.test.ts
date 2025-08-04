import { generatePredictionForMarket } from '@/lib/services/prediction-service'
import { marketQueries, predictionQueries } from '@/lib/db/queries'
import type { Market } from '@/lib/types'

// Mock the database queries
jest.mock('@/lib/db/queries', () => ({
  marketQueries: {
    getMarketById: jest.fn(),
  },
  predictionQueries: {
    createPrediction: jest.fn(),
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('generatePredictionForMarket', () => {
  const mockMarket: Market = {
    id: 'test-market-1',
    question: 'Will Team A win the championship?',
    description: 'Championship game between Team A and Team B',
    endDate: new Date('2024-12-31'),
    eventId: 'test-event-1',
    outcomePrices: ['0.65', '0.35'],
    volume: '100000',
    liquidity: '50000',
    updatedAt: new Date(),
  }

  const mockOpenRouterResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          prediction: 'Yes, Team A will win',
          probability: 0.75,
          reasoning: 'Team A has shown strong performance throughout the season',
          confidence_level: 'High'
        })
      }
    }]
  }

  const mockCreatedPrediction = {
    id: 1,
    userMessage: mockMarket.question,
    marketId: mockMarket.id,
          predictionResult: {
        prediction: 'Yes, Team A will win',
        probability: 0.75,
        reasoning: 'Team A has shown strong performance throughout the season',
        confidence_level: 'High' as const
      },
    modelName: 'google/gemini-2.5-flash-lite',
    systemPrompt: expect.any(String),
    aiResponse: JSON.stringify(mockOpenRouterResponse.choices[0].message.content),
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('successful prediction generation', () => {
    beforeEach(() => {
      // Mock successful database operations
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(predictionQueries.createPrediction as jest.Mock).mockResolvedValue(mockCreatedPrediction)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenRouterResponse)
      })
    })

    it('should generate a prediction successfully with all market data', async () => {
      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully generated and saved prediction for market test-market-1')
      expect(result.predictionId).toBe(1)
      expect(result.prediction).toEqual({
        prediction: 'Yes, Team A will win',
        probability: 0.75,
        reasoning: 'Team A has shown strong performance throughout the season',
        confidence_level: 'High'
      })
    })

    it('should use custom model name when provided', async () => {
      const customModel = 'anthropic/claude-3.7-sonnet'
      await generatePredictionForMarket('test-market-1', customModel)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining(`"model":"${customModel}"`)
        })
      )
    })

    it('should include market description and end date in the prompt', async () => {
      await generatePredictionForMarket('test-market-1')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('Market Description: Championship game between Team A and Team B')
        })
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('Market End Date: 2024-12-31')
        })
      )
    })

    it('should handle market without description and end date', async () => {
      const marketWithoutOptionalFields = {
        ...mockMarket,
        description: undefined,
        endDate: undefined,
      }
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(marketWithoutOptionalFields)

      await generatePredictionForMarket('test-market-1')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      const userContent = requestBody.messages[1].content

      expect(userContent).not.toContain('Market Description:')
      expect(userContent).not.toContain('Market End Date:')
    })
  })

  describe('error handling', () => {
    it('should return error when marketId is empty', async () => {
      const result = await generatePredictionForMarket('')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Market ID is required')
      expect(result.predictionId).toBeUndefined()
      expect(result.prediction).toBeUndefined()
    })

    it('should return error when market is not found', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(null)

      const result = await generatePredictionForMarket('non-existent-market')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Market with ID non-existent-market not found in database')
    })



    it('should handle OpenRouter API errors', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('OpenRouter API error: 500 Internal Server Error')
    })

    it('should handle rate limiting errors', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429
      })

      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('OpenRouter rate limit exceeded. Please wait before making another request.')
    })

    it('should handle invalid JSON response from AI', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'This is not valid JSON'
            }
          }]
        })
      })
      ;(predictionQueries.createPrediction as jest.Mock).mockResolvedValue(mockCreatedPrediction)

      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('AI model returned invalid JSON response')
    })

    it('should handle database save failures', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenRouterResponse)
      })
      ;(predictionQueries.createPrediction as jest.Mock).mockResolvedValue(null)

      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to save prediction to database')
    })

    it('should handle unexpected errors', async () => {
      ;(marketQueries.getMarketById as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const result = await generatePredictionForMarket('test-market-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Database connection failed')
    })
  })

  describe('API request structure', () => {
    beforeEach(() => {
      ;(marketQueries.getMarketById as jest.Mock).mockResolvedValue(mockMarket)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenRouterResponse)
      })
      ;(predictionQueries.createPrediction as jest.Mock).mockResolvedValue(mockCreatedPrediction)
    })

    it('should make request with correct headers', async () => {
      await generatePredictionForMarket('test-market-1')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://betterai.com',
            'X-Title': 'BetterAI Prediction Service',
            'Content-Type': 'application/json',
          }
        })
      )
    })

    it('should include system prompt with correct structure', async () => {
      await generatePredictionForMarket('test-market-1')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      const systemMessage = requestBody.messages[0]

      expect(systemMessage.role).toBe('system')
      expect(systemMessage.content).toContain('You are a prediction analysis expert')
      expect(systemMessage.content).toContain('"prediction"')
      expect(systemMessage.content).toContain('"probability"')
      expect(systemMessage.content).toContain('"reasoning"')
      expect(systemMessage.content).toContain('"confidence_level"')

      expect(systemMessage.content).not.toContain('"timeframe"')
      expect(systemMessage.content).not.toContain('"risks"')
    })
  })
}) 