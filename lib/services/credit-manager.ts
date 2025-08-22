import { prisma } from '../db/prisma'
import { userQueries } from '../db/queries'
import { CreditBalance } from '../types'

export interface CreditTransaction {
  userId: string
  amount: number  // positive = earned, negative = spent
  reason: string  // "daily_reset", "prediction_generated", "signup_bonus"
  marketId?: string
  predictionId?: number
}

export class CreditManager {
  private static readonly DAILY_CREDIT_RESET = 100
  private static readonly LOW_CREDIT_THRESHOLD = 10

  /**
   * Get current credit balance for a user
   */
  async getUserCredits(userId: string): Promise<CreditBalance | null> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        return null
      }

      return {
        credits: user.credits,
        creditsLastReset: user.creditsLastReset || new Date(),
        totalCreditsEarned: user.totalCreditsEarned,
        totalCreditsSpent: user.totalCreditsSpent
      }
    } catch (error) {
      console.error('Error getting user credits:', error)
      return null
    }
  }

  /**
   * Consume credits for a user
   * Returns true if successful, false if insufficient credits
   */
  async consumeCredits(
    userId: string,
    amount: number,
    reason: string,
    metadata?: { marketId?: string; predictionId?: number }
  ): Promise<boolean> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        return false
      }

      // Check if user has enough credits
      if (user.credits < amount) {
        return false
      }

      // Update user credits in transaction
      await userQueries.updateUserCredits(
        userId,
        user.credits - amount, // new credits value
        undefined, // earnedAmount stays the same
        user.totalCreditsSpent + amount // spentAmount
      )

      // Log the transaction (we can add this later if needed)
      console.log(`Credit consumed: ${userId}, amount: ${amount}, reason: ${reason}`)

      return true
    } catch (error) {
      console.error('Error consuming credits:', error)
      return false
    }
  }

  /**
   * Add credits to a user
   */
  async addCredits(
    userId: string,
    amount: number,
    reason: string,
    metadata?: { marketId?: string; predictionId?: number }
  ): Promise<void> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      await userQueries.updateUserCredits(
        userId,
        user.credits + amount,
        user.totalCreditsEarned + amount,
        undefined // spentAmount stays the same
      )

      // Log the transaction
      console.log(`Credits added: ${userId}, amount: ${amount}, reason: ${reason}`)
    } catch (error) {
      console.error('Error adding credits:', error)
      throw error
    }
  }

  /**
   * Reset daily credits for a user
   * Ensures user gets at least DAILY_CREDIT_RESET credits
   */
  async resetDailyCredits(userId: string): Promise<void> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const newCredits = Math.max(user.credits, CreditManager.DAILY_CREDIT_RESET)
      const creditsAdded = newCredits - user.credits

      await userQueries.resetUserDailyCredits(userId, newCredits)

      console.log(`Daily credits reset for ${userId}: ${user.credits} -> ${newCredits}`)
    } catch (error) {
      console.error('Error resetting daily credits:', error)
      throw error
    }
  }

  /**
   * Check if user should see the "Add Credits" button (< 10 credits)
   */
  async shouldShowAddCreditsButton(userId: string): Promise<boolean> {
    try {
      const user = await userQueries.getUserById(userId)
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
  async getUsersCredits(userIds: string[]): Promise<Record<string, CreditBalance | null>> {
    try {
      const users = await userQueries.getUsersByIds(userIds)

      const result: Record<string, CreditBalance | null> = {}

      for (const userId of userIds) {
        const user = users.find(u => u.id === userId)
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
    } catch (error) {
      console.error('Error getting users credits:', error)
      return {}
    }
  }

  /**
   * Initialize credits for a new user (100 credits on signup)
   */
  async initializeUserCredits(userId: string): Promise<void> {
    try {
      await this.addCredits(userId, 100, 'signup_bonus')
      console.log(`Initialized credits for new user: ${userId}`)
    } catch (error) {
      console.error('Error initializing user credits:', error)
      throw error
    }
  }

  /**
   * Get credit statistics for analytics
   */
  async getCreditStats(): Promise<{
    totalUsers: number
    totalCreditsInCirculation: number
    totalCreditsEarned: number
    totalCreditsSpent: number
    usersWithLowCredits: number
  }> {
    try {
      const stats = await userQueries.getCreditStats()
      const usersWithLowCredits = await userQueries.getUsersWithLowCreditsCount(CreditManager.LOW_CREDIT_THRESHOLD)

      return {
        totalUsers: stats.totalUsers,
        totalCreditsInCirculation: stats.totalCreditsInCirculation,
        totalCreditsEarned: stats.totalCreditsEarned,
        totalCreditsSpent: stats.totalCreditsSpent,
        usersWithLowCredits
      }
    } catch (error) {
      console.error('Error getting credit stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const creditManager = new CreditManager()
