import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import type { TRPCContext } from './context'

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        // Add more context for debugging
        path: shape.path,
        timestamp: new Date().toISOString(),
      },
    }
  },
})

// Base router and procedure
export const router = t.router
export const middleware = t.middleware
export const publicProcedure = t.procedure

// Enhanced authentication middleware with better error messages
const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to continue.',
    })
  }
  
  // Validate user data
  if (!ctx.user.id || typeof ctx.user.id !== 'string') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid user session. Please sign in again.',
    })
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(authMiddleware)

// Cron job authentication middleware
export const cronProcedure = t.procedure.use(({ ctx, next }) => {
  const authHeader = ctx.req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (token !== process.env.CRON_SECRET) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Invalid cron secret. This endpoint is reserved for scheduled tasks.',
    })
  }
  
  return next({ ctx })
})

// Admin procedure with enhanced validation
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for admin access.',
    })
  }
  
  // Check admin privileges
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  if (!adminUserIds.includes(ctx.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN', 
      message: 'Administrator privileges required for this operation.',
    })
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})