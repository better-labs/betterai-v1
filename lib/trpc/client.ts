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
export const createTRPCClient = (baseUrl: string = '', getAccessToken?: () => Promise<string | null>) => {
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
        headers: async () => {
          // Include Privy access token if available
          if (getAccessToken) {
            try {
              const token = await getAccessToken()
              if (token) {
                return {
                  Authorization: `Bearer ${token}`,
                }
              }
            } catch (error) {
              // Don't throw here - let the request proceed without token
              // This allows public procedures to work even if auth fails
              console.warn('Failed to get access token, proceeding without auth:', error)
            }
          }
          // Return empty headers if no getAccessToken function or if token retrieval failed
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