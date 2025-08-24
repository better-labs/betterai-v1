/**
 * tRPC context configuration - Dual Context System
 * This file defines contexts for both HTTP requests (fetch) and Server Components (RSC).
 * 
 * - Fetch Context: For /api/trpc routes with HTTP requests
 * - RSC Context: For Server Components using server caller (no HTTP hop)
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
 * Create fetch context for tRPC procedures from Next.js HTTP request
 * This extracts user authentication and other context from HTTP requests
 * Used by: /api/trpc routes
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
    // Debug: Log the Authorization header
    const authHeader = req.headers.get('authorization')
    console.log('tRPC Context: Authorization header:', authHeader ? 'Present' : 'Missing')
    
    // Try to get user ID from Privy token (if present)
    const authResult = await optionalAuth(req)
    if (authResult) {
      userId = authResult.userId
      console.log('tRPC Context: User authenticated:', userId)
    } else {
      console.log('tRPC Context: No authentication result')
    }

    // Get rate limit identifier for this request
    rateLimitId = await getRateLimitIdentifier(req, userId)
  } catch (error) {
    // Don't fail context creation if auth check fails
    // Individual procedures can handle auth as needed
    console.warn('tRPC Context creation warning:', error)
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

/**
 * Re-export RSC context creators from server.ts for convenience
 * This enables: import { createRSCContext } from '@/lib/trpc/context'
 */
export { createRSCContext, createRSCContextWithAuth } from './server'