import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/user/credits/route'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  createAuthErrorResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}))

vi.mock('@/lib/services/credit-manager', () => ({
  creditManager: {
    getUserCredits: vi.fn(),
    consumeCredits: vi.fn(),
    addCredits: vi.fn(),
    resetDailyCredits: vi.fn()
  }
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  getRateLimitIdentifier: vi.fn().mockReturnValue('test-user-id')
}))

const { requireAuth } = await import('@/lib/auth')
const { creditManager } = await import('@/lib/services/credit-manager')
const { checkRateLimit } = await import('@/lib/rate-limit')

describe('/api/user/credits Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - Authenticated User', () => {
    it('should return properly serialized dates from database', async () => {
      // Mock authenticated user
      vi.mocked(requireAuth).mockResolvedValue({
        userId: 'test-user-123',
        sessionId: 'test-session'
      })

      // Mock credit manager returning Date object (like from database)
      vi.mocked(creditManager.getUserCredits).mockResolvedValue({
        credits: 100,
        creditsLastReset: new Date('2024-01-01T00:00:00.000Z'), // Database returns Date
        totalCreditsEarned: 200,
        totalCreditsSpent: 100
      })

      const request = new NextRequest('http://localhost:3000/api/user/credits', {
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.isAuthenticated).toBe(true)
      expect(data.data.credits).toBeDefined()
      
      // ✅ CRITICAL TEST: Ensure dates are serialized as strings, not Date objects
      expect(typeof data.data.credits.creditsLastReset).toBe('string')
      expect(data.data.credits.creditsLastReset).toBe('2024-01-01T00:00:00.000Z')
      
      // ✅ Ensure the string can be safely converted back to Date
      expect(() => new Date(data.data.credits.creditsLastReset)).not.toThrow()
      
      // ✅ Verify it's a valid ISO string
      const parsedDate = new Date(data.data.credits.creditsLastReset)
      expect(parsedDate.toISOString()).toBe(data.data.credits.creditsLastReset)
    })
  })

  describe('GET - Unauthenticated User', () => {
    it('should gracefully handle unauthenticated users', async () => {
      // Mock authentication failure
      vi.mocked(requireAuth).mockRejectedValue(new Error('No valid authorization header'))

      const request = new NextRequest('http://localhost:3000/api/user/credits', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.isAuthenticated).toBe(false)
      expect(data.data.credits).toBeNull()
      expect(data.data.message).toBe('User not authenticated')
    })
  })

  describe('POST - Credit Operations', () => {
    it('should consume credits and return updated serialized data', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        userId: 'test-user-123',
        sessionId: 'test-session'
      })

      vi.mocked(creditManager.consumeCredits).mockResolvedValue(true)
      
      // Mock the updated credits after consumption
      vi.mocked(creditManager.getUserCredits).mockResolvedValue({
        credits: 99,
        creditsLastReset: new Date('2024-01-01T00:00:00.000Z'),
        totalCreditsEarned: 200,
        totalCreditsSpent: 101
      })

      const request = new NextRequest('http://localhost:3000/api/user/credits', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'consume',
          amount: 1,
          reason: 'prediction_generated'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.credits).toBeDefined()
      
      // ✅ Ensure POST also returns properly serialized dates
      expect(typeof data.data.credits.creditsLastReset).toBe('string')
      expect(() => new Date(data.data.credits.creditsLastReset)).not.toThrow()
    })
  })
})
