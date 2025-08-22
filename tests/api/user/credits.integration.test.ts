import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/user/credits/route'

// Mock the auth to simulate authenticated user
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    userId: 'test-user-123',
    sessionId: 'test-session'
  }),
  createAuthErrorResponse: vi.fn()
}))

vi.mock('@/lib/services/credit-manager', () => ({
  creditManager: {
    getUserCredits: vi.fn().mockResolvedValue({
      credits: 100,
      creditsLastReset: new Date('2024-01-01T00:00:00Z'), // This will be serialized as string
      totalCreditsEarned: 200,
      totalCreditsSpent: 100
    })
  }
}))

describe('/api/user/credits Integration', () => {
  it('should return properly serialized dates', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isAuthenticated).toBe(true)
    expect(data.credits).toBeDefined()
    
    // Critical test: Ensure dates come back as ISO strings, not Date objects
    expect(typeof data.credits.creditsLastReset).toBe('string')
    expect(() => new Date(data.credits.creditsLastReset)).not.toThrow()
    
    // Ensure the string is a valid ISO date
    const date = new Date(data.credits.creditsLastReset)
    expect(date.toISOString()).toBe(data.credits.creditsLastReset)
  })
})
