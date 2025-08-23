import { appRouter } from './root'
import { createRSCContext } from './context/rsc'
import type { AppRouter } from './root'

/**
 * Get server caller with RSC context
 * Use this in Server Components, Server Actions, etc.
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { getServerCaller } from '@/lib/trpc/server-caller'
 * 
 * export default async function MarketsPage() {
 *   const api = await getServerCaller()
 *   const markets = await api.markets.search({ q: 'election', limit: 10 })
 *   
 *   return <div>{markets.data.items.map(...)}</div>
 * }
 * ```
 */
export async function getServerCaller() {
  const ctx = await createRSCContext()
  return appRouter.createCaller(ctx)
}

/**
 * Type helper for server caller
 */
export type ServerCaller = Awaited<ReturnType<typeof getServerCaller>>

/**
 * Create server caller with custom context (for testing, etc.)
 */
export function createServerCaller(context: Parameters<typeof appRouter.createCaller>[0]) {
  return appRouter.createCaller(context)
}

// Re-export router type for convenience
export type { AppRouter }