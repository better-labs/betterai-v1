import type { PrismaClient, User, UserWatchlist, Market, Prediction } from '@/lib/generated/prisma'
import { mapUserToDTO, mapUsersToDTO, type UserDTO } from '@/lib/dtos'
import type { CreditBalance } from '@/lib/services/credit-manager'

/**
 * User service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs (never raw Prisma models)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getUserById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<User | null> {
  return await db.user.findUnique({
    where: { id }
  })
}

export async function getUserByIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<UserDTO | null> {
  const user = await getUserById(db, id)
  if (!user) return null
  return mapUserToDTO(user)
}

export async function getUserByEmail(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  email: string
): Promise<User | null> {
  return await db.user.findFirst({
    where: { email }
  })
}

export async function getUserByWalletAddress(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  walletAddress: string
): Promise<User | null> {
  return await db.user.findFirst({
    where: { walletAddress }
  })
}

export async function createUser(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }
): Promise<User> {
  return await db.user.create({ data: userData })
}

export async function updateUser(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  userData: Partial<{
    email: string
    walletAddress: string
    username: string
    avatar: string
  }>
): Promise<User | null> {
  return await db.user.update({
    where: { id },
    data: { ...userData, updatedAt: new Date() }
  })
}

export async function upsertUser(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }
): Promise<User> {
  return await db.user.upsert({
    where: { id: userData.id },
    update: { ...userData, updatedAt: new Date() },
    create: userData
  })
}

export async function deleteUser(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<boolean> {
  const result = await db.user.delete({ where: { id } })
  return !!result
}

export async function getUserWithPredictions(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<(User & { predictions: Prediction[] }) | null> {
  return await db.user.findUnique({
    where: { id },
    include: {
      predictions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
}

// Credit-related functions
export async function getUserCredits(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<CreditBalance | null> {
  const user = await db.user.findUnique({
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
}

export async function updateUserCredits(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  credits: number,
  totalCreditsEarned?: number,
  totalCreditsSpent?: number
): Promise<User | null> {
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

  return await db.user.update({
    where: { id },
    data: updateData
  })
}

export async function resetUserDailyCredits(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  minCredits: number = 100
): Promise<User | null> {
  const user = await db.user.findUnique({
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

  return await db.user.update({
    where: { id },
    data: {
      credits: newCredits,
      creditsLastReset: new Date(),
      totalCreditsEarned: user.totalCreditsEarned + creditsAdded,
      updatedAt: new Date()
    }
  })
}

export async function getUsersWithLowCredits(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  threshold: number = 10
): Promise<Pick<User, 'id' | 'email' | 'username' | 'credits' | 'creditsLastReset'>[]> {
  return await db.user.findMany({
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
}

export async function getCreditStats(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
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
      credits: { lt: 10 }
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

// User Watchlist functions
export async function getUserWatchlist(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userId: string
): Promise<(UserWatchlist & { market: Market })[]> {
  return await db.userWatchlist.findMany({
    where: { userId },
    include: {
      market: true
    },
    orderBy: { addedAt: 'desc' }
  })
}

export async function addToWatchlist(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userId: string,
  marketId: string
): Promise<UserWatchlist> {
  return await db.userWatchlist.create({
    data: {
      userId,
      marketId
    }
  })
}

export async function removeFromWatchlist(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userId: string,
  marketId: string
): Promise<boolean> {
  const result = await db.userWatchlist.deleteMany({
    where: {
      userId,
      marketId
    }
  })
  return result.count > 0
}

export async function isInWatchlist(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userId: string,
  marketId: string
): Promise<boolean> {
  const watchlistItem = await db.userWatchlist.findFirst({
    where: {
      userId,
      marketId
    }
  })
  return !!watchlistItem
}

export async function getWatchlistCount(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userId: string
): Promise<number> {
  return await db.userWatchlist.count({
    where: { userId }
  })
}