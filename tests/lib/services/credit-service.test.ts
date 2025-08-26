import { describe, it, expect, beforeEach, vi } from 'vitest'
import { creditService } from '@/lib/services/credit-service'

// Mock Prisma client
const mockDb = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
}

describe('creditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCredits', () => {
    it('should return user credit balance', async () => {
      mockDb.user.findUnique.mockResolvedValue({ credits: 75 })
      
      const result = await creditService.getCredits(mockDb as any, 'user-123')
      
      expect(result).toBe(75)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { credits: true }
      })
    })

    it('should throw error for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      
      await expect(
        creditService.getCredits(mockDb as any, 'nonexistent')
      ).rejects.toThrow('User not found: nonexistent')
    })
  })

  describe('consume', () => {
    it('should consume credits and return new balance', async () => {
      mockDb.user.findUnique.mockResolvedValue({ 
        credits: 100, 
        totalCreditsSpent: 50 
      })
      mockDb.user.update.mockResolvedValue({ credits: 97 })
      
      const result = await creditService.consume(mockDb as any, 'user-123', 3, 'test')
      
      expect(result).toBe(97)
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: { decrement: 3 },
          totalCreditsSpent: { increment: 3 }
        },
        select: { credits: true }
      })
    })

    it('should throw error for insufficient credits', async () => {
      mockDb.user.findUnique.mockResolvedValue({ 
        credits: 5, 
        totalCreditsSpent: 95 
      })
      
      await expect(
        creditService.consume(mockDb as any, 'user-123', 10, 'test')
      ).rejects.toThrow('Insufficient credits: 5 available, 10 required')
    })

    it('should throw error for negative amount', async () => {
      await expect(
        creditService.consume(mockDb as any, 'user-123', -5, 'test')
      ).rejects.toThrow('Credit amount must be positive')
    })
  })

  describe('refund', () => {
    it('should refund credits and return new balance', async () => {
      mockDb.user.update.mockResolvedValue({ credits: 105 })
      
      const result = await creditService.refund(mockDb as any, 'user-123', 5, 'refund test')
      
      expect(result).toBe(105)
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          credits: { increment: 5 },
          totalCreditsSpent: { decrement: 5 }
        },
        select: { credits: true }
      })
    })

    it('should throw error for negative refund amount', async () => {
      await expect(
        creditService.refund(mockDb as any, 'user-123', -3, 'test')
      ).rejects.toThrow('Refund amount must be positive')
    })
  })

  describe('hasCredits', () => {
    it('should return true when user has sufficient credits', async () => {
      mockDb.user.findUnique.mockResolvedValue({ credits: 50 })
      
      const result = await creditService.hasCredits(mockDb as any, 'user-123', 25)
      
      expect(result).toBe(true)
    })

    it('should return false when user has insufficient credits', async () => {
      mockDb.user.findUnique.mockResolvedValue({ credits: 10 })
      
      const result = await creditService.hasCredits(mockDb as any, 'user-123', 25)
      
      expect(result).toBe(false)
    })
  })
})