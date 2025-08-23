import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { prisma } from '@/lib/db/prisma'
import { getAuthFromRequest } from '@/lib/auth/privy-auth'
import type { AppContext } from './types'

/**
 * Create tRPC context for fetch adapter (API routes)
 * Used by: /api/trpc/[trpc]/route.ts
 * 
 * This function receives a Web API Request object and creates
 * the full application context including auth and services.
 */
export async function createFetchContext(
  opts: FetchCreateContextFnOptions
): Promise<AppContext> {
  // Check for cron authentication first
  const authHeader = opts.req.headers.get('authorization')
  const cronToken = authHeader?.replace('Bearer ', '')
  
  // If this is a valid cron request, skip Privy auth
  if (cronToken === process.env.CRON_SECRET) {
    return {
      user: null, // Cron jobs don't have user context
      session: undefined,
      prisma,
    } satisfies AppContext
  }
  
  // Otherwise, use standard Privy authentication
  const auth = await getAuthFromRequest(opts.req)
  
  return {
    // Auth context
    ...auth,
    // Service injection
    prisma,
  } satisfies AppContext
}

/**
 * Type export for use in tRPC router definitions
 */
export type FetchContext = Awaited<ReturnType<typeof createFetchContext>>