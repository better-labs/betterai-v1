import { prisma } from '../db/prisma'
import { userQueries } from '../db/queries'
import { CreditBalanceServer } from '../types'

export interface CreditTransaction {
  userId: string
  credits: number
  reason: string
  predictionId?: number
}

export class CreditManager {
  static readonly LOW_CREDIT_THRESHOLD = 10

  /**
   * Get a user's current credit balance
   */
  async getUserCredits(userId: string): Promise<CreditBalanceServer | null> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) return null

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
   * Add credits to a user's account
   */
  async addCredits(userId: string, credits: number, reason: string, predictionId?: number): Promise<boolean> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        console.error(`User not found: ${userId}`)
        return false
      }

      const newCredits = user.credits + credits
      await userQueries.updateUserCredits(userId, newCredits, user.totalCreditsEarned + credits)

      // Log the transaction
      console.log(`Added ${credits} credits to user ${userId}. Reason: ${reason}. New balance: ${newCredits}`)

      return true
    } catch (error) {
      console.error('Error adding credits:', error)
      return false
    }
  }

  /**
   * Spend credits from a user's account
   */
  async spendCredits(userId: string, credits: number, reason: string, predictionId?: number): Promise<boolean> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        console.error(`User not found: ${userId}`)
        return false
      }

      if (user.credits < credits) {
        console.error(`Insufficient credits for user ${userId}. Required: ${credits}, Available: ${user.credits}`)
        return false
      }

      const newCredits = user.credits - credits
      await userQueries.updateUserCredits(userId, newCredits, user.totalCreditsSpent + credits)

      // Log the transaction
      console.log(`Spent ${credits} credits from user ${userId}. Reason: ${reason}. New balance: ${newCredits}`)

      return true
    } catch (error) {
      console.error('Error spending credits:', error)
      return false
    }
  }

  /**
   * Check if a user should see the "add credits" button
   */
  async shouldShowAddCreditsButton(userId: string): Promise<boolean> {
    try {
      const user = await userQueries.getUserById(userId)
      if (!user) {
        console.error(`User not found: ${userId}`)
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
  async getUsersCredits(userIds: string[]): Promise<Record<string, CreditBalanceServer | null>> {
    try {
      const users = await userQueries.getUsersByIds(userIds)

      const result: Record<string, CreditBalanceServer | null> = {}

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
