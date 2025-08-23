import { headers, cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { getAuthFromHeadersCookies } from '@/lib/auth/privy-auth'
import type { AppContext } from './types'

/**
 * Create tRPC context for Server Components (RSC)
 * Used by: Server caller in RSC pages/components
 * 
 * This function uses Next.js headers() and cookies() functions
 * to extract auth information in Server Component context.
 */
export async function createRSCContext(): Promise<AppContext> {
  // Get Next.js headers and cookies in RSC context
  const headersList = headers()
  const cookiesList = cookies()
  
  // Extract auth using transport-agnostic function
  const auth = await getAuthFromHeadersCookies({
    headers: headersList,
    cookies: cookiesList,
  })
  
  return {
    // Auth context
    ...auth,
    // Service injection
    prisma,
  } satisfies AppContext
}

/**
 * Type export for use in server caller
 */
export type RSCContext = Awaited<ReturnType<typeof createRSCContext>>