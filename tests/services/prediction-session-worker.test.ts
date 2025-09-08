import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PredictionSessionStatus } from '@/lib/generated/prisma'
import {
  executePredictionSession,
  executePredictionSessionWithRetry,
  type WorkerResult
} from '@/lib/services/prediction-session-worker'

// Mock dependencies
vi.mock('@/lib/services/generate-single-prediction', () => ({
  generatePredictionForMarket: vi.fn()
}))

vi.mock('@/lib/services/prediction-session-service', () => ({
  getPredictionSessionById: vi.fn(),
  updatePredictionSession: vi.fn()
}))

vi.mock('@/lib/services/credit-manager', () => ({
  creditManager: {
    refundCredits: vi.fn()
  }
}))

import { generatePredictionForMarket } from '@/lib/services/generate-single-prediction'
import { getPredictionSessionById, updatePredictionSession } from '@/lib/services/prediction-session-service'
import { creditManager } from '@/lib/services/credit-manager'

// Mock database client
const mockDb = {
  prediction: {
    update: vi.fn()
  }
}

describe('PredictionSessionWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.log = vi.fn()
    console.error = vi.fn()
  })

  // Helper function to create complete mock session
  const createMockSession = (overrides?: Partial<any>) => ({
    id: 'session-123',
    userId: 'user-456',
    marketId: 'market-789',
    selectedModels: ['gpt-4', 'claude-3'],
    status: 'INITIALIZING' as PredictionSessionStatus,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    predictions: [],
    market: {
      id: 'market-789',
      question: 'Will it rain tomorrow?',
      outcomes: ['Yes', 'No']
    },
    ...overrides
  })

  describe('executePredictionSession', () => {
    const mockSession = createMockSession()

    it('should execute all models and finish with success (one success scenario)', async () => {
      vi.mocked(getPredictionSessionById).mockResolvedValue(mockSession)
      vi.mocked(generatePredictionForMarket)
        .mockResolvedValueOnce({ success: true, predictionId: 1, message: 'Success' })
        .mockResolvedValueOnce({ success: false, message: 'Failed' })
      
      mockDb.prediction.update.mockResolvedValue({})
      vi.mocked(updatePredictionSession).mockResolvedValue()

      const result = await executePredictionSession(mockDb as any, 'session-123')

      expect(result).toEqual({
        success: true,
        totalModels: 2,
        successCount: 1,
        failureCount: 1
      })

      expect(updatePredictionSession).toHaveBeenCalledWith(mockDb, 'session-123', {
        status: 'GENERATING',
        step: 'Starting prediction generation'
      })

      expect(updatePredictionSession).toHaveBeenLastCalledWith(mockDb, 'session-123', {
        status: 'FINISHED',
        step: 'Completed 1/2 predictions',
        completedAt: expect.any(Date)
      })

      expect(mockDb.prediction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { sessionId: 'session-123' }
      })
    })

    it('should refund credits when all models fail', async () => {
      vi.mocked(getPredictionSessionById).mockResolvedValue(mockSession)
      vi.mocked(generatePredictionForMarket)
        .mockResolvedValueOnce({ success: false, message: 'Failed 1' })
        .mockResolvedValueOnce({ success: false, message: 'Failed 2' })
      
      vi.mocked(creditManager.refundCredits).mockResolvedValue(110)
      vi.mocked(updatePredictionSession).mockResolvedValue()

      const result = await executePredictionSession(mockDb as any, 'session-123')

      expect(result).toEqual({
        success: true,
        totalModels: 2,
        successCount: 0,
        failureCount: 2
      })

      expect(creditManager.refundCredits).toHaveBeenCalledWith(
        mockDb,
        'user-456',
        2,
        'All models failed for session session-123',
        { marketId: 'market-789' }
      )

      expect(updatePredictionSession).toHaveBeenLastCalledWith(mockDb, 'session-123', {
        status: 'ERROR',
        step: 'All models failed - credits refunded',
        error: 'All 2 models failed to generate predictions'
      })
    })

    it('should handle partial success scenario', async () => {
      const sessionWith3Models = createMockSession({
        selectedModels: ['gpt-4', 'claude-3', 'gemini']
      })

      vi.mocked(getPredictionSessionById).mockResolvedValue(sessionWith3Models)
      vi.mocked(generatePredictionForMarket)
        .mockResolvedValueOnce({ success: true, predictionId: 1, message: 'Success' })
        .mockResolvedValueOnce({ success: false, message: 'Failed' })
        .mockResolvedValueOnce({ success: true, predictionId: 2, message: 'Success' })
      
      mockDb.prediction.update.mockResolvedValue({})
      vi.mocked(updatePredictionSession).mockResolvedValue()

      const result = await executePredictionSession(mockDb as any, 'session-123')

      expect(result).toEqual({
        success: true,
        totalModels: 3,
        successCount: 2,
        failureCount: 1
      })

      expect(updatePredictionSession).toHaveBeenLastCalledWith(mockDb, 'session-123', {
        status: 'FINISHED',
        step: 'Completed 2/3 predictions',
        completedAt: expect.any(Date)
      })

      expect(creditManager.refundCredits).not.toHaveBeenCalled()
    })

    it('should handle session not found error', async () => {
      vi.mocked(getPredictionSessionById).mockResolvedValue(null)

      const result = await executePredictionSession(mockDb as any, 'invalid-session')

      expect(result).toEqual({
        success: false,
        totalModels: 0,
        successCount: 0,
        failureCount: 0,
        error: 'Session not found: invalid-session'
      })
    })


    it('should handle credit refund failure gracefully', async () => {
      vi.mocked(getPredictionSessionById).mockResolvedValue(mockSession)
      vi.mocked(generatePredictionForMarket)
        .mockResolvedValueOnce({ success: false, message: 'Failed 1' })
        .mockResolvedValueOnce({ success: false, message: 'Failed 2' })
      
      vi.mocked(creditManager.refundCredits).mockRejectedValue(new Error('Refund failed'))
      vi.mocked(updatePredictionSession).mockResolvedValue()

      const result = await executePredictionSession(mockDb as any, 'session-123')

      expect(result.successCount).toBe(0)
      expect(result.failureCount).toBe(2)

      expect(updatePredictionSession).toHaveBeenLastCalledWith(mockDb, 'session-123', {
        status: 'ERROR',
        error: 'All models failed and credit refund failed: Refund failed'
      })
    })
  })

  describe('executePredictionSessionWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockSession = createMockSession({
        selectedModels: ['gpt-4']
      })

      vi.mocked(getPredictionSessionById).mockResolvedValue(mockSession)
      vi.mocked(generatePredictionForMarket).mockResolvedValue({
        success: true,
        predictionId: 1,
        message: 'Success'
      })
      mockDb.prediction.update.mockResolvedValue({})
      vi.mocked(updatePredictionSession).mockResolvedValue()

      const result = await executePredictionSessionWithRetry(mockDb as any, 'session-123')

      expect(result.success).toBe(true)
      expect(result.successCount).toBe(1)
    })

    it('should retry and eventually succeed', async () => {
      const mockSession = createMockSession({
        selectedModels: ['gpt-4']
      })

      vi.mocked(getPredictionSessionById)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockSession)
      
      vi.mocked(generatePredictionForMarket).mockResolvedValue({
        success: true,
        predictionId: 1,
        message: 'Success'
      })
      mockDb.prediction.update.mockResolvedValue({})
      vi.mocked(updatePredictionSession).mockResolvedValue()

      // Mock setTimeout to avoid actual delays in tests
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn()
        return 0 as any
      })

      const result = await executePredictionSessionWithRetry(mockDb as any, 'session-123', 2)

      expect(result.success).toBe(true)
      expect(result.successCount).toBe(1)
    })

    it('should fail after max attempts', async () => {
      const persistentError = new Error('Persistent error')
      vi.mocked(getPredictionSessionById).mockRejectedValue(persistentError)
      vi.mocked(updatePredictionSession).mockResolvedValue()

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn()
        return 0 as any
      })

      const result = await executePredictionSessionWithRetry(mockDb as any, 'session-123', 2)

      expect(result.success).toBe(false)
      expect(result.totalModels).toBe(0)
      expect(result.successCount).toBe(0)
      expect(result.failureCount).toBe(0)
      expect(result.error).toContain('Worker failed after 2 attempts:')

      expect(updatePredictionSession).toHaveBeenLastCalledWith(mockDb, 'session-123', {
        status: 'ERROR',
        error: expect.stringContaining('Worker failed after 2 attempts:')
      })
    })
  })
})