/**
 * tRPC Provider for React components
 * This provides tRPC and React Query context to the application
 * Note: This runs alongside existing QueryProvider without conflicts
 */

'use client'

import { useState } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { trpc, createTRPCClient, getBaseUrl } from '@/lib/trpc/client'

interface TRPCProviderProps {
  children: React.ReactNode
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  // Create stable instances to prevent re-initialization
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  const [trpcClient] = useState(() => createTRPCClient(getBaseUrl()))

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  )
}

// Export for easy access to tRPC client in components
export { trpc } from '@/lib/trpc/client'