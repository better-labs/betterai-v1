import { TRPCError } from '@trpc/server'
import { middleware } from '../server'

/**
 * Enhanced authentication middleware with detailed error handling
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  // Check if user is authenticated
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to continue.',
    })
  }

  // Validate user ID format
  if (!ctx.user.id || typeof ctx.user.id !== 'string' || ctx.user.id.length === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED', 
      message: 'Invalid user session. Please sign in again.',
    })
  }

  // Validate session ID if present
  if (ctx.user.sessionId && (typeof ctx.user.sessionId !== 'string' || ctx.user.sessionId.length === 0)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid session. Please sign in again.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // TypeScript knows user is defined now
    },
  })
})

/**
 * Optional authentication middleware - doesn't throw if not authenticated
 */
export const optionalAuthMiddleware = middleware(async ({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      user: ctx.user || null,
    },
  })
})

/**
 * Admin authentication middleware - requires special permissions
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    })
  }

  // Check if user has admin privileges
  // This would typically check a database or role system
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  
  if (!adminUserIds.includes(ctx.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Administrator access required.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/**
 * Rate limiting middleware - can be combined with auth
 */
export const rateLimitMiddleware = (
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute
) => middleware(async ({ ctx, next }) => {
  // This would integrate with your existing rate limiting system
  // For now, just pass through
  return next({ ctx })
})