import { prisma } from "../prisma"
import type { User, UserWatchlist, Market, Prediction } from '../../../lib/generated/prisma';
import type { CreditBalance } from '@/lib/services/credit-manager';

// User queries
export const userQueries = {
  getUserById: async (id: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { id }
    })
  },
  getUserByEmail: async (email: string): Promise<User | null> => {
    return await prisma.user.findFirst({
      where: { email }
    })
  },
  getUserByWalletAddress: async (walletAddress: string): Promise<User | null> => {
    return await prisma.user.findFirst({
      where: { walletAddress }
    })
  },
  createUser: async (userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }): Promise<User> => {
    return await prisma.user.create({ data: userData })
  },
  updateUser: async (id: string, userData: Partial<{
    email: string
    walletAddress: string
    username: string
    avatar: string
  }>): Promise<User | null> => {
    return await prisma.user.update({
      where: { id },
      data: { ...userData, updatedAt: new Date() }
    })
  },
  upsertUser: async (userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }): Promise<User> => {
    return await prisma.user.upsert({
      where: { id: userData.id },
      update: { ...userData, updatedAt: new Date() },
      create: userData
    })
  },
  deleteUser: async (id: string): Promise<boolean> => {
    const result = await prisma.user.delete({ where: { id } })
    return !!result
  },
  getUserWithPredictions: async (id: string): Promise<(User & { predictions: Prediction[] }) | null> => {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  },

  // Credit-related queries
  getUserCredits: async (id: string): Promise<CreditBalance | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        credits: true,
        creditsLastReset: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true
      }
    })

    if (!user) {
      return null
    }

    return {
      credits: user.credits,
      creditsLastReset: user.creditsLastReset || new Date(),
      totalCreditsEarned: user.totalCreditsEarned,
      totalCreditsSpent: user.totalCreditsSpent
    }
  },

  updateUserCredits: async (
    id: string,
    credits: number,
    totalCreditsEarned?: number,
    totalCreditsSpent?: number
  ): Promise<User | null> => {
    const updateData: any = {
      credits,
      updatedAt: new Date()
    }

    if (totalCreditsEarned !== undefined) {
      updateData.totalCreditsEarned = totalCreditsEarned
    }

    if (totalCreditsSpent !== undefined) {
      updateData.totalCreditsSpent = totalCreditsSpent
    }

    return await prisma.user.update({
      where: { id },
      data: updateData
    })
  },

  resetUserDailyCredits: async (id: string, minCredits: number = 100): Promise<User | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        credits: true,
        totalCreditsEarned: true
      }
    })

    if (!user) {
      return null
    }

    const newCredits = Math.max(user.credits, minCredits)
    const creditsAdded = Math.max(0, newCredits - user.credits)

    return await prisma.user.update({
      where: { id },
      data: {
        credits: newCredits,
        creditsLastReset: new Date(),
        totalCreditsEarned: user.totalCreditsEarned + creditsAdded,
        updatedAt: new Date()
      }
    })
  },

  getUsersWithLowCredits: async (threshold: number = 10): Promise<Pick<User, 'id' | 'email' | 'username' | 'credits' | 'creditsLastReset'>[]> => {
    return await prisma.user.findMany({
      where: {
        credits: { lt: threshold }
      },
      select: {
        id: true,
        email: true,
        username: true,
        credits: true,
        creditsLastReset: true
      }
    })
  },

  getCreditStats: async (lowCreditThreshold: number = 10): Promise<{
    totalUsers: number
    totalCreditsInCirculation: number
    totalCreditsEarned: number
    totalCreditsSpent: number
    usersWithLowCredits: number
  }> => {
    const stats = await prisma.user.aggregate({
      _count: { id: true },
      _sum: {
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true
      }
    })

    const usersWithLowCredits = await prisma.user.count({
      where: {
        credits: { lt: lowCreditThreshold }
      }
    })

    return {
      totalUsers: stats._count.id,
      totalCreditsInCirculation: stats._sum.credits || 0,
      totalCreditsEarned: stats._sum.totalCreditsEarned || 0,
      totalCreditsSpent: stats._sum.totalCreditsSpent || 0,
      usersWithLowCredits
    }
  },
  
  /**
   * Get multiple users' credit balances
   */
  getUsersCredits: async (userIds: string[]): Promise<User[]> => {
    return await prisma.user.findMany({
      where: {
        id: { in: userIds }
      }
    })
  }
}

// User Watchlist queries
export const userWatchlistQueries = {
  getUserWatchlist: async (userId: string): Promise<(UserWatchlist & { market: Market })[]> => {
    return await prisma.userWatchlist.findMany({
      where: { userId },
      include: {
        market: true
      },
      orderBy: { addedAt: 'desc' }
    })
  },
  addToWatchlist: async (userId: string, marketId: string): Promise<UserWatchlist> => {
    return await prisma.userWatchlist.create({
      data: {
        userId,
        marketId
      }
    })
  },
  removeFromWatchlist: async (userId: string, marketId: string): Promise<boolean> => {
    const result = await prisma.userWatchlist.deleteMany({
      where: {
        userId,
        marketId
      }
    })
    return result.count > 0
  },
  isInWatchlist: async (userId: string, marketId: string): Promise<boolean> => {
    const watchlistItem = await prisma.userWatchlist.findFirst({
      where: {
        userId,
        marketId
      }
    })
    return !!watchlistItem
  },
  getWatchlistCount: async (userId: string): Promise<number> => {
    return await prisma.userWatchlist.count({
      where: { userId }
    })
  }
}