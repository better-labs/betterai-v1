import type { DbClient } from './types'
import * as userService from './user-service'

export interface CreditTransaction {
  userId: string
  amount: number  // positive = earned, negative = spent
  reason: string  // "daily_reset", "prediction_generated", "signup_bonus"
  marketId?: string
  predictionId?: number
}

export interface CreditBalance {
  credits: number
  creditsLastReset: Date
  totalCreditsEarned: number
  totalCreditsSpent: number
}

export class CreditManager {
  private static readonly DAILY_CREDIT_RESET = 100
  private static readonly LOW_CREDIT_THRESHOLD = 10

  /**
   * Get current credit balance for a user
   */
  async getUserCredits(
    db: DbClient,
    userId: string
  ): Promise<CreditBalance> {
    const credits = await userService.getUserCredits(db, userId)
    if (!credits) {
      throw new Error(`User not found: ${userId}`)
    }
    return credits
  }

  /**
   * Consume credits for a user
   * Throws error if insufficient credits or user not found
   */
  async consumeCredits(
    db: DbClient,
    userId: string,
    amount: number,
    reason: string,
    metadata?: { marketId?: string; predictionId?: number }
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive")
    }

    const user = await userService.getUserById(db, userId)
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    // Check if user has enough credits
    if (user.credits < amount) {
      throw new Error(`Insufficient credits: ${user.credits} available, ${amount} required`)
    }

    // Update user credits
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: amount },
        totalCreditsSpent: { increment: amount },
        updatedAt: new Date()
      },
      select: { credits: true }
    })

    console.log(`Credit consumed: ${userId}, amount: ${amount}, reason: ${reason}`)
    return updatedUser.credits
  }

  /**
   * Add credits to a user (for bonuses/additions)
   * Returns new balance after addition
   */
  async addCredits(
    db: DbClient,
    userId: string,
    amount: number,
    reason: string,
    metadata?: { marketId?: string; predictionId?: number }
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive")
    }

    const user = await userService.getUserById(db, userId)
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
        totalCreditsEarned: { increment: amount },
        updatedAt: new Date()
      },
      select: { credits: true }
    })

    console.log(`Credits added: ${userId}, amount: ${amount}, reason: ${reason}`)
    return updatedUser.credits
  }

  /**
   * Refund credits to a user (decrements totalCreditsSpent)
   * Returns new balance after refund
   */
  async refundCredits(
    db: DbClient,
    userId: string,
    amount: number,
    reason: string,
    metadata?: { marketId?: string; predictionId?: number }
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error("Refund amount must be positive")
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
        totalCreditsSpent: { decrement: amount },
        updatedAt: new Date()
      },
      select: { credits: true }
    })

    console.log(`Credits refunded: ${userId}, amount: ${amount}, reason: ${reason}`)
    return updatedUser.credits
  }

  /**
   * Reset daily credits for a user
   * Ensures user gets at least DAILY_CREDIT_RESET credits
   */
  async resetDailyCredits(
    db: DbClient,
    userId: string
  ): Promise<void> {
    const user = await userService.getUserById(db, userId)
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    const newCredits = Math.max(user.credits, CreditManager.DAILY_CREDIT_RESET)
    const creditsAdded = newCredits - user.credits

    await db.user.update({
      where: { id: userId },
      data: {
        credits: newCredits,
        creditsLastReset: new Date(),
        totalCreditsEarned: user.totalCreditsEarned + Math.max(0, creditsAdded),
        updatedAt: new Date()
      }
    })

    console.log(`Daily credits reset for ${userId}: ${user.credits} -> ${newCredits}`)
  }

  /**
   * Check if user should see the "Add Credits" button (< 10 credits)
   */
  async shouldShowAddCreditsButton(
    db: DbClient,
    userId: string
  ): Promise<boolean> {
    try {
      const user = await userService.getUserById(db, userId)
      if (!user) {
        return false
      }

      return user.credits < CreditManager.LOW_CREDIT_THRESHOLD
    } catch (error) {
      console.error('Error checking add credits button visibility:', error)
      return false
    }
  }

  /**
   * Get multiple users' credit balances (for admin/batch operations)
   */
  async getUsersCredits(
    db: DbClient,
    userIds: string[]
  ): Promise<Record<string, CreditBalance | null>> {
    const users = await db.user.findMany({
      where: {
        id: { in: userIds }
      }
    })

    const result: Record<string, CreditBalance | null> = {}

    for (const userId of userIds) {
      const user = users.find((u: any) => u.id === userId)
      if (user) {
        result[userId] = {
          credits: user.credits,
          creditsLastReset: user.creditsLastReset || new Date(),
          totalCreditsEarned: user.totalCreditsEarned,
          totalCreditsSpent: user.totalCreditsSpent
        }
      } else {
        result[userId] = null
      }
    }

    return result
  }

  /**
   * Initialize credits for a new user (100 credits on signup)
   */
  async initializeUserCredits(
    db: DbClient,
    userId: string
  ): Promise<void> {
    await this.addCredits(db, userId, 100, 'signup_bonus')
    console.log(`Initialized credits for new user: ${userId}`)
  }

  /**
   * Get credit statistics for analytics
   */
  async getCreditStats(
    db: DbClient
  ): Promise<{
    totalUsers: number
    totalCreditsInCirculation: number
    totalCreditsEarned: number
    totalCreditsSpent: number
    usersWithLowCredits: number
  }> {
    const stats = await db.user.aggregate({
      _count: { id: true },
      _sum: {
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true
      }
    })

    const usersWithLowCredits = await db.user.count({
      where: {
        credits: { lt: CreditManager.LOW_CREDIT_THRESHOLD }
      }
    })

    return {
      totalUsers: stats._count.id,
      totalCreditsInCirculation: stats._sum.credits || 0,
      totalCreditsEarned: stats._sum.totalCreditsEarned || 0,
      totalCreditsSpent: stats._sum.totalCreditsSpent || 0,
      usersWithLowCredits
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(
    db: DbClient,
    userId: string,
    requiredAmount: number
  ): Promise<boolean> {
    try {
      const credits = await this.getUserCredits(db, userId)
      return credits.credits >= requiredAmount
    } catch (error) {
      console.error('Error checking credits:', error)
      return false
    }
  }
}

// Export singleton instance
export const creditManager = new CreditManager()