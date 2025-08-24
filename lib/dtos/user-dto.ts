import { serializeDecimals } from "@/lib/serialization"
import type { User } from "@/lib/generated/prisma"
import type { ISODateString } from "@/lib/types"

/**
 * User DTO for serialized responses safe for Client Components
 */
export interface UserDTO {
  id: string
  email?: string | null
  walletAddress?: string | null
  username?: string | null
  avatar?: string | null
  createdAt?: ISODateString | null
  updatedAt?: ISODateString | null
  credits: number
  creditsLastReset?: ISODateString | null
  totalCreditsEarned: number
  totalCreditsSpent: number
}

/**
 * Convert raw Prisma User model to serialized DTO safe for Client Components
 */
export function mapUserToDTO(user: User): UserDTO {
  const serialized = serializeDecimals(user) as any
  
  return {
    id: serialized.id,
    email: serialized.email ?? null,
    walletAddress: serialized.walletAddress ?? null,
    username: serialized.username ?? null,
    avatar: serialized.avatar ?? null,
    createdAt: serialized.createdAt ?? null,
    updatedAt: serialized.updatedAt ?? null,
    credits: serialized.credits,
    creditsLastReset: serialized.creditsLastReset ?? null,
    totalCreditsEarned: serialized.totalCreditsEarned,
    totalCreditsSpent: serialized.totalCreditsSpent,
  }
}

/**
 * Convert array of Prisma User models to DTOs
 */
export function mapUsersToDTO(users: User[]): UserDTO[] {
  const serialized = serializeDecimals(users) as any[]
  
  return serialized.map((user) => ({
    id: user.id,
    email: user.email ?? null,
    walletAddress: user.walletAddress ?? null,
    username: user.username ?? null,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
    credits: user.credits,
    creditsLastReset: user.creditsLastReset ?? null,
    totalCreditsEarned: user.totalCreditsEarned,
    totalCreditsSpent: user.totalCreditsSpent,
  }))
}