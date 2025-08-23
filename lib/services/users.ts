import { PrismaClient, Prisma } from '@/lib/generated/prisma'

// Type for Prisma client or transaction
type PrismaContext = PrismaClient | Prisma.TransactionClient

/**
 * Get user credits by user ID
 */
export async function getUserCredits(
  db: PrismaContext,
  userId: string
): Promise<{
  credits: number
  creditsLastReset: Date | null
  totalCreditsEarned: number
  totalCreditsSpent: number
} | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      creditsLastReset: true,
      totalCreditsEarned: true,
      totalCreditsSpent: true,
    },
  })

  return user
}

/**
 * Update user credits
 */
export async function updateUserCredits(
  db: PrismaContext,
  userId: string,
  credits: number,
  totalCreditsEarned?: number,
  totalCreditsSpent?: number
): Promise<{
  credits: number
  creditsLastReset: Date | null
  totalCreditsEarned: number
  totalCreditsSpent: number
} | null> {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        credits,
        ...(totalCreditsEarned !== undefined && { totalCreditsEarned }),
        ...(totalCreditsSpent !== undefined && { totalCreditsSpent }),
        updatedAt: new Date(),
      },
      select: {
        credits: true,
        creditsLastReset: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
      },
    })

    return updated
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // User not found
      return null
    }
    throw error
  }
}

/**
 * Reset user daily credits
 */
export async function resetUserDailyCredits(
  db: PrismaContext,
  userId: string,
  newCredits: number = 100
): Promise<{
  credits: number
  creditsLastReset: Date | null
  totalCreditsEarned: number
  totalCreditsSpent: number
} | null> {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        credits: newCredits,
        creditsLastReset: new Date(),
        updatedAt: new Date(),
      },
      select: {
        credits: true,
        creditsLastReset: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
      },
    })

    return updated
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * Create a new user with default credits
 */
export async function createUser(
  db: PrismaContext,
  data: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }
): Promise<{
  id: string
  email: string | null
  walletAddress: string | null
  username: string | null
  avatar: string | null
  credits: number
  creditsLastReset: Date | null
  totalCreditsEarned: number
  totalCreditsSpent: number
  createdAt: Date | null
  updatedAt: Date | null
}> {
  const user = await db.user.create({
    data: {
      id: data.id,
      email: data.email,
      walletAddress: data.walletAddress,
      username: data.username,
      avatar: data.avatar,
      credits: 100, // Default starting credits
      creditsLastReset: new Date(),
      totalCreditsEarned: 100,
      totalCreditsSpent: 0,
    },
  })

  return user
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  db: PrismaContext,
  userId: string,
  data: {
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }
): Promise<{
  id: string
  email: string | null
  walletAddress: string | null
  username: string | null
  avatar: string | null
  createdAt: Date | null
  updatedAt: Date | null
} | null> {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.walletAddress !== undefined && { walletAddress: data.walletAddress }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return updated
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * Get user by ID
 */
export async function getUserById(
  db: PrismaContext,
  userId: string
): Promise<{
  id: string
  email: string | null
  walletAddress: string | null
  username: string | null
  avatar: string | null
  credits: number
  creditsLastReset: Date | null
  totalCreditsEarned: number
  totalCreditsSpent: number
  createdAt: Date | null
  updatedAt: Date | null
} | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  return user
}

/**
 * Delete user
 */
export async function deleteUser(
  db: PrismaContext,
  userId: string
): Promise<boolean> {
  try {
    await db.user.delete({
      where: { id: userId },
    })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    throw error
  }
}