import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreditManager } from '@/lib/services/credit-manager'
import { userQueries } from '@/lib/db/queries'

// Mock the entire db module
vi.mock('@/lib/db/queries', () => ({
  userQueries: {
    getUserById: vi.fn(),
    updateUserCredits: vi.fn(),
    resetUserDailyCredits: vi.fn(),
  }
}))

// Mock prisma directly
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn()
    }
  }
}))

describe('CreditManager', () => {
  let creditManager: CreditManager

  beforeEach(() => {
    vi.clearAllMocks()
    creditManager = new CreditManager()
  })

  describe('getUserCredits', () => {
    it('should return null when user not found', async () => {
      vi.mocked(userQueries.getUserById).mockResolvedValue(null)

      const result = await creditManager.getUserCredits('user-123')

      expect(result).toBeNull()
      expect(userQueries.getUserById).toHaveBeenCalledWith('user-123')
    })

    it('should return credit balance for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 50,
        creditsLastReset: new Date('2024-01-01'),
        totalCreditsEarned: 150,
        totalCreditsSpent: 100
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)

      const result = await creditManager.getUserCredits('user-123')

      expect(result).toEqual({
        credits: 50,
        creditsLastReset: new Date('2024-01-01'),
        totalCreditsEarned: 150,
        totalCreditsSpent: 100
      })
    })
  })

  describe('consumeCredits', () => {
    it('should return false when user not found', async () => {
      vi.mocked(userQueries.getUserById).mockResolvedValue(null)

      const result = await creditManager.consumeCredits('user-123', 10, 'test')

      expect(result).toBe(false)
    })

    it('should return false when user has insufficient credits', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 5,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 10
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)

      const result = await creditManager.consumeCredits('user-123', 10, 'test')

      expect(result).toBe(false)
      expect(userQueries.updateUserCredits).not.toHaveBeenCalled()
    })

    it('should successfully consume credits', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 20,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 10
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(userQueries.updateUserCredits).mockResolvedValue(mockUser)

      const result = await creditManager.consumeCredits('user-123', 10, 'test')

      expect(result).toBe(true)
      expect(userQueries.updateUserCredits).toHaveBeenCalledWith(
        'user-123',
        10,
        undefined,
        20
      )
    })

    it('should successfully consume credits with direct prisma mock', async () => {
      const { prisma } = await import('@/lib/db/prisma')
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 20,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 10
      }

      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const result = await creditManager.consumeCredits('user-123', 10, 'test')

      expect(result).toBe(true)
    })
  })

  describe('addCredits', () => {
    it('should throw error when user not found', async () => {
      vi.mocked(userQueries.getUserById).mockResolvedValue(null)

      await expect(creditManager.addCredits('user-123', 10, 'test')).rejects.toThrow('User not found')
    })

    it('should successfully add credits', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 20,
        creditsLastReset: new Date(),
        totalCreditsEarned: 30,
        totalCreditsSpent: 10
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(userQueries.updateUserCredits).mockResolvedValue(mockUser)

      await creditManager.addCredits('user-123', 10, 'test')

      expect(userQueries.updateUserCredits).toHaveBeenCalledWith(
        'user-123',
        30,
        40,
        undefined
      )
    })
  })

  describe('resetDailyCredits', () => {
    it('should throw error when user not found', async () => {
      vi.mocked(userQueries.getUserById).mockResolvedValue(null)

      await expect(creditManager.resetDailyCredits('user-123')).rejects.toThrow('User not found')
    })

    it('should reset credits to minimum when user has less than minimum', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 50,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 0
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(userQueries.resetUserDailyCredits).mockResolvedValue(mockUser)

      await creditManager.resetDailyCredits('user-123')

      expect(userQueries.resetUserDailyCredits).toHaveBeenCalledWith('user-123', 100)
    })
  })

  describe('shouldShowAddCreditsButton', () => {
    it('should return false when user not found', async () => {
      vi.mocked(userQueries.getUserById).mockResolvedValue(null)

      const result = await creditManager.shouldShowAddCreditsButton('user-123')

      expect(result).toBe(false)
    })

    it('should return true when credits are below threshold', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 5,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 0
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)

      const result = await creditManager.shouldShowAddCreditsButton('user-123')

      expect(result).toBe(true)
    })

    it('should return false when credits are above threshold', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        walletAddress: null,
        username: 'testuser',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 50,
        creditsLastReset: new Date(),
        totalCreditsEarned: 100,
        totalCreditsSpent: 0
      }
      vi.mocked(userQueries.getUserById).mockResolvedValue(mockUser)

      const result = await creditManager.shouldShowAddCreditsButton('user-123')

      expect(result).toBe(false)
    })
  })
})
