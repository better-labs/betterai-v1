import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userQueries } from '@/lib/db/queries'
import { prisma } from '@/lib/db/prisma'

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn()
    }
  }
}))

describe('User Credit Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserCredits', () => {
    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await userQueries.getUserCredits('user-123')

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          credits: true,
          creditsLastReset: true,
          totalCreditsEarned: true,
          totalCreditsSpent: true
        }
      })
    })

    it('should return credit balance for existing user', async () => {
      const mockUser = {
        credits: 50,
        creditsLastReset: new Date('2024-01-01'),
        totalCreditsEarned: 150,
        totalCreditsSpent: 100
      }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await userQueries.getUserCredits('user-123')

      expect(result).toEqual({
        credits: 50,
        creditsLastReset: new Date('2024-01-01'),
        totalCreditsEarned: 150,
        totalCreditsSpent: 100
      })
    })
  })

  describe('updateUserCredits', () => {
    it('should update all credit fields', async () => {
      const mockUser = { id: 'user-123', credits: 50 }
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const result = await userQueries.updateUserCredits(
        'user-123',
        100,
        200,
        50
      )

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: 100,
          totalCreditsEarned: 200,
          totalCreditsSpent: 50,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUser)
    })

    it('should only update credits when other fields are undefined', async () => {
      const mockUser = { id: 'user-123', credits: 50 }
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const result = await userQueries.updateUserCredits('user-123', 100)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: 100,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('resetUserDailyCredits', () => {
    it('should reset credits to minimum when user has less than minimum', async () => {
      const mockUser = { id: 'user-123', credits: 50, totalCreditsEarned: 100 }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const result = await userQueries.resetUserDailyCredits('user-123', 100)

      expect(result).toEqual(mockUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: 100,
          creditsLastReset: expect.any(Date),
          totalCreditsEarned: 150, // 100 + 50 (added)
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should preserve existing credits when above minimum', async () => {
      const mockUser = { id: 'user-123', credits: 150, totalCreditsEarned: 200 }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      const result = await userQueries.resetUserDailyCredits('user-123', 100)

      expect(result).toEqual(mockUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: 150, // unchanged since above minimum
          creditsLastReset: expect.any(Date),
          totalCreditsEarned: 200, // unchanged since no credits added
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await userQueries.resetUserDailyCredits('user-123', 100)

      expect(result).toBeNull()
    })
  })

  describe('getCreditStats', () => {
    it('should return comprehensive credit statistics', async () => {
      const mockStats = {
        _count: { id: 100 },
        _sum: {
          credits: 5000,
          totalCreditsEarned: 10000,
          totalCreditsSpent: 5000
        }
      }
      vi.mocked(prisma.user.aggregate).mockResolvedValue(mockStats)
      vi.mocked(prisma.user.count).mockResolvedValue(15)

      const result = await userQueries.getCreditStats()

      expect(result).toEqual({
        totalUsers: 100,
        totalCreditsInCirculation: 5000,
        totalCreditsEarned: 10000,
        totalCreditsSpent: 5000,
        usersWithLowCredits: 15
      })
    })
  })
})
