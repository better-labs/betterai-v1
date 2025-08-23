'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import React, { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { usePrivy } from '@privy-io/react-auth'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getAccessToken } = usePrivy()
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
      },
    },
  }))
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          async headers() {
            try {
              const token = await getAccessToken()
              return {
                authorization: token ? `Bearer ${token}` : '',
              }
            } catch (error) {
              console.log('Failed to get auth token:', error)
              return {}
            }
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}