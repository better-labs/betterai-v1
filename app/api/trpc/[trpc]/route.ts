/**
 * tRPC API route handler for Next.js App Router
 * This creates the HTTP endpoint for tRPC at /api/trpc/[...trpc]
 * 
 * Note: This runs alongside existing REST endpoints without interfering
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/lib/trpc/routers/_app'
import { createContext } from '@/lib/trpc/context'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }