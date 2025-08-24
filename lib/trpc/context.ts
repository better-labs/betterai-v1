/**
 * tRPC context configuration
 * This file defines the context that will be available to all tRPC procedures.
 * It includes user authentication, rate limiting identifiers, and other shared data.
 */

import { type NextRequest } from 'next/server'
import { optionalAuth } from '@/lib/auth'
import { getRateLimitIdentifier } from '@/lib/rate-limit'

export interface Context {
  req?: NextRequest
  userId?: string
  rateLimitId?: string
}

/**
 * Create context for tRPC procedures from Next.js request
 * This extracts user authentication and other context from the request
 */
export const createContext = async (opts: {
  req?: NextRequest
}): Promise<Context> => {
  const { req } = opts

  if (!req) {
    // For SSG or other cases where there's no request
    return {}
  }

  let userId: string | undefined
  let rateLimitId: string | undefined

  try {
    // Try to get user ID from Privy token (if present)
    const authResult = await optionalAuth(req)
    if (authResult) {
      userId = authResult.userId
    }

    // Get rate limit identifier for this request
    rateLimitId = await getRateLimitIdentifier(req, userId)
  } catch (error) {
    // Don't fail context creation if auth check fails
    // Individual procedures can handle auth as needed
    console.warn('Context creation warning:', error)
  }

  return {
    req,
    userId,
    rateLimitId,
  }
}

/**
 * Context type inference helper
 * Use this to get proper TypeScript types for your context
 */
export type ContextType = Awaited<ReturnType<typeof createContext>>