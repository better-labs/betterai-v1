import { PrismaClient } from '@/lib/generated/prisma'

/**
 * Authentication context - what we know about the current user
 */
export interface AuthContext {
  user: {
    id: string
    email?: string
    sessionId: string
  } | null
  session?: {
    token: string
    expiresAt?: Date
  }
}

/**
 * Full application context - includes auth + services
 */
export interface AppContext extends AuthContext {
  prisma: PrismaClient
  // Can extend with other services as needed:
  // redis?: Redis
  // logger?: Logger
  // featureFlags?: FeatureFlags
}

/**
 * Raw auth data extracted from request headers/cookies
 */
export interface AuthData {
  cookie: string
  authHeader: string
}