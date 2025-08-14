import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/utils'

interface User {
  id: string
  email?: string
  walletAddress?: string
  username?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export function useUser() {
  const { ready, authenticated, user: privyUser, getAccessToken } = usePrivy()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch or create user in database when authenticated
  useEffect(() => {
    if (!ready || !authenticated || !privyUser) {
      setUser(null)
      return
    }

    const syncUser = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // First try to get existing user
        const response = await authenticatedFetch(
          '/api/user',
          { method: 'GET' },
          getAccessToken
        )

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          return
        }

        // If user doesn't exist (404), create them
        if (response.status === 404) {
          const createResponse = await authenticatedFetch(
            '/api/user',
            {
              method: 'POST',
              body: JSON.stringify({
                email: privyUser.email?.address,
                walletAddress: privyUser.wallet?.address,
                username: privyUser.google?.name || privyUser.email?.name,
                avatar: privyUser.google?.picture || privyUser.email?.picture
              })
            },
            getAccessToken
          )

          if (createResponse.ok) {
            const data = await createResponse.json()
            setUser(data.user)
          } else {
            throw new Error('Failed to create user')
          }
        } else {
          throw new Error('Failed to fetch user')
        }
      } catch (err) {
        console.error('User sync error:', err)
        setError(err instanceof Error ? err.message : 'Failed to sync user')
      } finally {
        setLoading(false)
      }
    }

    syncUser()
  }, [ready, authenticated, privyUser, getAccessToken])

  return {
    user,
    loading,
    error,
    isAuthenticated: authenticated,
    isReady: ready
  }
}
