/**
 * tRPC server-side caller for RSC/SSR usage
 * This allows Server Components to call tRPC procedures directly without HTTP
 */

import 'server-only'

import { cookies, headers } from 'next/headers'
import { appRouter } from './routers/_app'
import { optionalAuth } from '@/lib/auth'
import { getRateLimitIdentifier } from '@/lib/rate-limit'
import type { Context } from './context'

/**
 * Create RSC context from Next.js headers and cookies
 * This is used for Server Components and server-side rendering
 */
export const createRSCContext = async (): Promise<Context> => {
  try {
    const cookieStore = await cookies()
    const headersList = await headers()

    // Create a Request-like object for auth checking
    // Extract authorization header if present
    const authHeader = headersList.get('authorization')
    
    // Create a minimal Request object for auth functions
    const mockRequest = new Request('http://localhost', {
      headers: {
        'authorization': authHeader || '',
        'cookie': cookieStore.toString(),
      }
    })

    let userId: string | undefined
    let rateLimitId: string | undefined

    // Try to get user ID from authentication
    const authResult = await optionalAuth(mockRequest)
    if (authResult) {
      userId = authResult.userId
    }

    // For RSC context, create simple rate limit ID since we don't have full NextRequest
    rateLimitId = userId ? `user:${userId}` : 'rsc:unknown'

    return {
      userId,
      rateLimitId,
    }
  } catch (error) {
    console.warn('RSC context creation warning:', error)
    return {}
  }
}

/**
 * Create RSC context from explicit auth data
 * Useful when you already have user context from other sources
 */
export const createRSCContextWithAuth = async (userId?: string): Promise<Context> => {
  try {
    let rateLimitId: string | undefined

    if (userId) {
      // For RSC context, create simple rate limit ID
      rateLimitId = `user:${userId}`
    }

    return {
      userId,
      rateLimitId,
    }
  } catch (error) {
    console.warn('RSC context with auth creation warning:', error)
    return { userId }
  }
}

/**
 * Server caller for use in Server Components
 * This bypasses HTTP and calls procedures directly using the router's createCaller method
 */
export const createServerCaller = async (context?: Context) => {
  const ctx = context ?? await createRSCContext()
  // Use the router's built-in createCaller method for tRPC v11
  return appRouter.createCaller(ctx)
}

/**
 * Convenience function to create authenticated server caller
 * Throws if user is not authenticated
 */
export const createAuthenticatedServerCaller = async (userId: string) => {
  const context = await createRSCContextWithAuth(userId)
  if (!context.userId) {
    throw new Error('User not authenticated for server caller')
  }
  return appRouter.createCaller(context)
}

/**
 * Create server caller with automatic context detection
 * This is the main entry point for RSC usage
 */
export const createServerCallerAsync = () => createServerCaller()

/**
 * Utility to create server caller for authenticated users
 */
export const createAuthenticatedServerCallerAsync = (userId: string) => 
  createAuthenticatedServerCaller(userId)