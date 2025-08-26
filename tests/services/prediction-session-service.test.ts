import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PredictionSessionStatus } from '@/lib/generated/prisma'
import {
  createPredictionSession,
  getPredictionSessionById,
  updatePredictionSession,
  validateCreditsForSession,
  getUserRecentSessions,
  type CreatePredictionSessionInput,
  type PredictionSessionDTO
} from '@/lib/services/prediction-session-service'

// Mock database client
const mockDb = {
  predictionSession: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  }
}

describe('PredictionSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPredictionSession', () => {
    it('should create session and return sessionId', async () => {
      const input: CreatePredictionSessionInput = {
        userId: 'user-123',
        marketId: 'market-456',
        selectedModels: ['gpt-4', 'claude-3']
      }

      mockDb.predictionSession.create.mockResolvedValue({
        id: 'session-789'
      })

      const result = await createPredictionSession(mockDb as any, input)

      expect(result).toEqual({ sessionId: 'session-789' })
      expect(mockDb.predictionSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          marketId: 'market-456',
          selectedModels: ['gpt-4', 'claude-3'],
          status: 'INITIALIZING'
        },
        select: { id: true }
      })
    })
  })

  describe('getPredictionSessionById', () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-456',
      marketId: 'market-789',
      selectedModels: ['gpt-4'],
      status: 'FINISHED' as PredictionSessionStatus,
      step: null,
      error: null,
      createdAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-01'),
      predictions: [{
        id: 1,
        modelName: 'gpt-4',
        predictionResult: { prediction: 'Yes', confidence: 0.8 },
        aiResponse: 'AI reasoning',
        createdAt: new Date('2024-01-01')
      }],
      market: {
        id: 'market-789',
        question: 'Will X happen?',
        outcomes: ['Yes', 'No']
      }
    }

    it('should return session scoped to user', async () => {
      mockDb.predictionSession.findFirst.mockResolvedValue(mockSession)

      const result = await getPredictionSessionById(mockDb as any, 'session-123', 'user-456')

      expect(result).toEqual(mockSession)
      expect(mockDb.predictionSession.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          userId: 'user-456'
        },
        include: {
          predictions: {
            select: {
              id: true,
              modelName: true,
              predictionResult: true,
              aiResponse: true,
              createdAt: true
            },
            orderBy: { createdAt: 'asc' }
          },
          market: {
            select: {
              id: true,
              question: true,
              outcomes: true
            }
          }
        }
      })
    })

    it('should return null for non-existent session', async () => {
      mockDb.predictionSession.findFirst.mockResolvedValue(null)

      const result = await getPredictionSessionById(mockDb as any, 'invalid-id')

      expect(result).toBeNull()
    })

    it('should work without userId filter', async () => {
      mockDb.predictionSession.findFirst.mockResolvedValue(mockSession)

      await getPredictionSessionById(mockDb as any, 'session-123')

      expect(mockDb.predictionSession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        include: expect.any(Object)
      })
    })
  })

  describe('updatePredictionSession', () => {
    it('should update session fields', async () => {
      mockDb.predictionSession.update.mockResolvedValue({})

      await updatePredictionSession(mockDb as any, 'session-123', {
        status: 'GENERATING' as PredictionSessionStatus,
        step: 'Generating predictions'
      })

      expect(mockDb.predictionSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          status: 'GENERATING',
          step: 'Generating predictions'
        }
      })
    })

    it('should auto-set completedAt when status is FINISHED', async () => {
      mockDb.predictionSession.update.mockResolvedValue({})

      await updatePredictionSession(mockDb as any, 'session-123', {
        status: 'FINISHED'
      })

      expect(mockDb.predictionSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          status: 'FINISHED',
          completedAt: expect.any(Date)
        }
      })
    })
  })

  describe('validateCreditsForSession', () => {
    it('should return hasCredits true when user has enough credits', async () => {
      mockDb.user.findUnique.mockResolvedValue({ credits: 10 })

      const result = await validateCreditsForSession(mockDb as any, 'user-123', 3)

      expect(result).toEqual({
        hasCredits: true,
        currentCredits: 10,
        required: 3
      })
    })

    it('should return hasCredits false when user has insufficient credits', async () => {
      mockDb.user.findUnique.mockResolvedValue({ credits: 2 })

      const result = await validateCreditsForSession(mockDb as any, 'user-123', 5)

      expect(result).toEqual({
        hasCredits: false,
        currentCredits: 2,
        required: 5
      })
    })

    it('should throw error for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      await expect(
        validateCreditsForSession(mockDb as any, 'invalid-user', 1)
      ).rejects.toThrow('User not found: invalid-user')
    })
  })

  describe('getUserRecentSessions', () => {
    it('should return recent sessions for user and market', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          createdAt: new Date('2024-01-02'),
          status: 'FINISHED' as PredictionSessionStatus
        },
        {
          id: 'session-2',
          createdAt: new Date('2024-01-01'),
          status: 'GENERATING' as PredictionSessionStatus
        }
      ]

      mockDb.predictionSession.findMany.mockResolvedValue(mockSessions)

      const result = await getUserRecentSessions(mockDb as any, 'user-123', 'market-456')

      expect(result).toEqual(mockSessions)
      expect(mockDb.predictionSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          marketId: 'market-456',
          createdAt: { gte: expect.any(Date) }
        },
        select: {
          id: true,
          createdAt: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    })

    it('should filter by last 24 hours', async () => {
      mockDb.predictionSession.findMany.mockResolvedValue([])

      await getUserRecentSessions(mockDb as any, 'user-123', 'market-456')

      const call = mockDb.predictionSession.findMany.mock.calls[0][0]
      const gteDate = call.where.createdAt.gte
      const now = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      expect(gteDate.getTime()).toBeCloseTo(yesterday.getTime(), -1000)
    })
  })
})