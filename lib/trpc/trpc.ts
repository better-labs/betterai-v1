/**
 * tRPC configuration and utilities
 * This file sets up the basic tRPC configuration that will be used across the application.
 */

import { TRPCError, initTRPC } from '@trpc/server'
import { type Context } from './context'
import superjson from 'superjson'

// Initialize tRPC with context type
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      // Include additional error details in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    },
  }),
})

// Export reusable router and procedure builders
export const router = t.router
export const publicProcedure = t.procedure

// Authenticated procedure - requires user to be logged in
export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Now guaranteed to be defined
    },
  })
})

// Rate-limited procedure - includes rate limiting middleware
export const rateLimitedProcedure = authenticatedProcedure.use(async ({ ctx, next }) => {
  // TODO: Implement rate limiting using existing rate-limit service
  // For now, just pass through
  return next()
})

// Utility to create tRPC error from existing error patterns
export const createTRPCError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    return error
  }

  if (error instanceof Error) {
    // Map common error messages to appropriate tRPC error codes
    if (error.message.includes('not found')) {
      return new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
        cause: error,
      })
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new TRPCError({
        code: 'UNAUTHORIZED',
        message: error.message,
        cause: error,
      })
    }
    
    if (error.message.includes('rate limit')) {
      return new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: error.message,
        cause: error,
      })
    }
    
    // Default to internal server error
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    })
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    cause: error,
  })
}