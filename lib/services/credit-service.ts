import { PrismaClient } from "@/lib/generated/prisma"
import type { PrismaTransactionClient } from "@/lib/types"

export type CreditTransaction = {
  userId: string
  amount: number
  reason: string
  timestamp: Date
}

export const creditService = {
  /**
   * Get current credit balance for a user
   */
  async getCredits(
    db: PrismaClient | PrismaTransactionClient,
    userId: string
  ): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })
    
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }
    
    return user.credits
  },

  /**
   * Consume credits from a user's balance
   * Returns the new balance after consumption
   */
  async consume(
    db: PrismaClient | PrismaTransactionClient,
    userId: string,
    amount: number,
    reason: string
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive")
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true, totalCreditsSpent: true }
    })

    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    if (user.credits < amount) {
      throw new Error(`Insufficient credits: ${user.credits} available, ${amount} required`)
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: amount },
        totalCreditsSpent: { increment: amount }
      },
      select: { credits: true }
    })

    return updatedUser.credits
  },

  /**
   * Refund credits to a user's balance
   * Returns the new balance after refund
   */
  async refund(
    db: PrismaClient | PrismaTransactionClient,
    userId: string,
    amount: number,
    reason: string
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error("Refund amount must be positive")
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
        totalCreditsSpent: { decrement: amount }
      },
      select: { credits: true }
    })

    return updatedUser.credits
  },

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(
    db: PrismaClient | PrismaTransactionClient,
    userId: string,
    requiredAmount: number
  ): Promise<boolean> {
    const currentCredits = await this.getCredits(db, userId)
    return currentCredits >= requiredAmount
  }
}