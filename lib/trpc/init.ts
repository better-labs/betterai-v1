/**
 * tRPC initialization and configuration
 * Sets up the base tRPC instance with proper context and middleware
 */

import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'
import superjson from 'superjson'

/**
 * Create context for tRPC requests
 * This runs for every tRPC procedure call
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
  }
}

/**
 * Initialize tRPC with superjson transformer for automatic serialization
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson, // This handles Decimals, Dates, etc. automatically!
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Create a server-side caller for tRPC procedures
 */
export const createCallerFactory = t.createCallerFactory

/**
 * Basic tRPC router and procedure builders
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

/**
 * Middleware for procedures that require authentication
 * TODO: Integrate with your Privy auth system
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  // TODO: Add authentication logic here
  // For now, we'll skip auth for migration
  return next({
    ctx: {
      ...ctx,
      // user: authenticatedUser
    },
  })
})

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed)
