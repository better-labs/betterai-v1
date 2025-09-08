/**
 * tRPC Provider for React components
 * This provides tRPC and React Query context to the application
 * Note: This runs alongside existing QueryProvider without conflicts
 */

'use client'

import { useState, useMemo } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { trpc, createTRPCClient, getBaseUrl } from '@/lib/trpc/client'
import { usePrivy } from '@privy-io/react-auth'

interface TRPCProviderProps {
  children: React.ReactNode
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  // Safely get Privy context with fallback for SSR/hydration
  let getAccessToken: (() => Promise<string | null>) | undefined
  let authenticated = false
  let ready = false
  
  try {
    const privyContext = usePrivy()
    // Only use getAccessToken if Privy is ready
    if (privyContext.ready) {
      getAccessToken = privyContext.getAccessToken
    }
    authenticated = privyContext.authenticated
    ready = privyContext.ready
  } catch (error) {
    // Privy not available - this is expected during SSR or initial hydration
    // Don't log in production to avoid noise
    if (process.env.NODE_ENV === 'development') {
      console.warn('Privy context not available, using fallback')
    }
  }

  // Create stable instances to prevent re-initialization
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1 * 60 * 1000, // 1 minute - faster updates for market status changes
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Add retry configuration for better auth error handling
        retry: (failureCount, error: any) => {
          // Don't retry auth errors more than once
          if (error?.data?.code === 'UNAUTHORIZED') {
            return failureCount < 1
          }
          // Default retry behavior for other errors
          return failureCount < 3
        },
        retryDelay: 1000, // 1 second delay between retries
      },
    },
  }))

  // Create trpcClient that can access the current getAccessToken function
  // Depend on authentication state to recreate client when auth changes
  const trpcClient = useMemo(() => {
    // Only pass getAccessToken if Privy is ready to avoid race conditions
    return createTRPCClient(getBaseUrl(), ready ? getAccessToken : undefined)
  }, [getAccessToken, authenticated, ready])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  )
}

// Export for easy access to tRPC client in components
export { trpc } from '@/lib/trpc/client'