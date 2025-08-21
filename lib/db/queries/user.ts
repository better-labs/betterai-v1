import { prisma } from "../prisma"
import type { User, UserWatchlist, Market, Prediction } from '../../../lib/generated/prisma';

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