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
      },
    }
  },
})

// Base router and procedure
export const router = t.router
export const publicProcedure = t.procedure

// Authentication middleware
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

// Cron job authentication middleware
export const cronProcedure = t.procedure.use(({ ctx, next }) => {
  const authHeader = ctx.req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (token !== process.env.CRON_SECRET) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Invalid cron secret'
    })
  }
  
  return next({ ctx })
})