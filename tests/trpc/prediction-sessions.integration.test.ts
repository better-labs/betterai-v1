import { describe, it, expect, beforeEach, vi } from 'vitest'
import { appRouter } from '@/lib/trpc/routers/_app'

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    predictionSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    market: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock('@/lib/services/credit-manager', () => ({
  creditManager: {
    hasCredits: vi.fn(),
    consumeCredits: vi.fn(),
    getUserCredits: vi.fn()
  }
}))

vi.mock('@/lib/services/prediction-session-service', () => ({
  createPredictionSession: vi.fn(),
  getPredictionSessionById: vi.fn(),
  getUserRecentSessions: vi.fn()
}))

const { prisma } = await import('@/lib/db/prisma')
const { creditManager } = await import('@/lib/services/credit-manager')
const predictionSessionService = await import('@/lib/services/prediction-session-service')

describe('PredictionSessions tRPC Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockContext = {
    userId: 'test-user-123',
    sessionId: 'test-session',
    isAuthenticated: true
  }

  describe('predictionSessions.start', () => {
    it('should create session and consume credits in transaction', async () => {
      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = prisma // Use the already mocked prisma instance
        return await callback(mockTx as any)
      })

      // Mock credit validation and consumption
      vi.mocked(creditManager.hasCredits).mockResolvedValue(true)
      vi.mocked(creditManager.consumeCredits).mockResolvedValue(97)
      
      // Mock session creation
      vi.mocked(predictionSessionService.createPredictionSession).mockResolvedValue({
        sessionId: 'session-789'
      })

      const caller = appRouter.createCaller(mockContext)
      
      const result = await caller.predictionSessions.start({
        marketId: 'market-456',
        selectedModels: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini']
      })

      expect(result.sessionId).toBe('session-789')
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should reject when insufficient credits', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = prisma // Use the already mocked prisma instance
        return await callback(mockTx as any)
      })

      vi.mocked(creditManager.hasCredits).mockResolvedValue(false)
      vi.mocked(creditManager.getUserCredits).mockResolvedValue({
        credits: 1,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 99
      })

      const caller = appRouter.createCaller(mockContext)

      await expect(
        caller.predictionSessions.start({
          marketId: 'market-456',
          selectedModels: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash']
        })
      ).rejects.toThrow('Insufficient credits')
    })
  })

  describe('predictionSessions.status', () => {
    it('should return session with serialized dates', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'test-user-123',
        marketId: 'market-456',
        selectedModels: ['anthropic/claude-3.7-sonnet'],
        status: 'FINISHED' as const,
        step: null,
        error: null,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
        completedAt: new Date('2024-01-01T10:05:00.000Z'),
        predictions: [{
          id: '1',
          modelName: 'anthropic/claude-3.7-sonnet',
          predictionResult: { prediction: 'Yes', confidence: 0.8 },
          outcomes: ['Yes', 'No'],
          outcomesProbabilities: [0.8, 0.2],
          aiResponse: 'AI reasoning',
          createdAt: new Date('2024-01-01T10:03:00.000Z')
        }],
        market: {
          id: 'market-456',
          question: 'Will X happen?',
          outcomes: ['Yes', 'No']
        }
      }

      vi.mocked(predictionSessionService.getPredictionSessionById).mockResolvedValue(mockSession)

      const caller = appRouter.createCaller(mockContext)
      const result = await caller.predictionSessions.status({ sessionId: 'session-123' })

      expect(result.id).toBe('session-123')
      expect(result.status).toBe('FINISHED')
      // ✅ CRITICAL: Ensure dates are serialized as ISO strings
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.completedAt).toBe('string')
      expect(result.createdAt).toBe('2024-01-01T10:00:00.000Z')
      expect(result.completedAt).toBe('2024-01-01T10:05:00.000Z')
      
      // Verify predictions have serialized dates too
      expect(typeof result.predictions[0].createdAt).toBe('string')
    })

    it('should reject access to other users sessions', async () => {
      vi.mocked(predictionSessionService.getPredictionSessionById).mockResolvedValue(null)

      const caller = appRouter.createCaller(mockContext)

      await expect(
        caller.predictionSessions.status({ sessionId: 'other-user-session' })
      ).rejects.toThrow('Prediction session not found or access denied')
    })
  })

  describe('predictionSessions.recentByMarket', () => {
    it('should return recent sessions for user and market', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          createdAt: new Date('2024-01-02T10:00:00.000Z'),
          status: 'FINISHED' as const
        },
        {
          id: 'session-2', 
          createdAt: new Date('2024-01-01T10:00:00.000Z'),
          status: 'GENERATING' as const
        }
      ]

      vi.mocked(predictionSessionService.getUserRecentSessions).mockResolvedValue(mockSessions)

      const caller = appRouter.createCaller(mockContext)
      const result = await caller.predictionSessions.recentByMarket({ 
        marketId: 'market-456' 
      })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('session-1')
      expect(result[0].status).toBe('FINISHED')
      // ✅ Ensure dates are serialized as ISO strings
      expect(typeof result[0].createdAt).toBe('string')
      expect(result[0].createdAt).toBe('2024-01-02T10:00:00.000Z')
    })

    it('should handle empty results', async () => {
      vi.mocked(predictionSessionService.getUserRecentSessions).mockResolvedValue([])

      const caller = appRouter.createCaller(mockContext)
      const result = await caller.predictionSessions.recentByMarket({ 
        marketId: 'market-no-sessions' 
      })

      expect(result).toEqual([])
    })
  })
})