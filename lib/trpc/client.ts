/**
 * tRPC client configuration for React components
 * This provides strongly typed API calls with React Query integration
 */

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './routers/_app'

// Create the tRPC React Query client
export const trpc = createTRPCReact<AppRouter>()

// Client configuration function
export const createTRPCClient = (baseUrl: string = '') => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
        // Include cookies for authentication
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
        headers: () => {
          // Add any custom headers here
          return {}
        },
      }),
    ],
  })
}

// Utility to get base URL for client-side usage
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return ''
  }
  
  // SSR/SSG should use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Local development fallback
  return `http://localhost:${process.env.PORT ?? 3000}`
}