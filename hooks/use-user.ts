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

    // Debug: Log Privy user object to understand data structure
    // console.log('🔍 Privy User Object:', privyUser)
    // console.log('🔍 Privy User Email:', privyUser.email)
    // console.log('🔍 Privy User Google Data:', (privyUser as any).google)
    // console.log('🔍 Privy User Linked Accounts:', (privyUser as any).linkedAccounts)

    const syncUser = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Get access token, handle null case
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('No access token available')
        }

        // Create a wrapper function that returns Promise<string>
        const getToken = () => Promise.resolve(accessToken)

        // Debug: Log what data we're sending to the API
        const userDataToSend = {
          email: privyUser.email?.address || privyUser.google?.email,
          walletAddress: privyUser.wallet?.address,
          username: (privyUser as any)?.google?.name || (privyUser as any)?.email?.name,
          avatar: (privyUser as any)?.google?.picture || (privyUser as any)?.email?.picture,
          // Include identity token if available for verification
          identityToken: (privyUser as any)?.identityToken
        }
        // console.log('📤 Sending user data to API:', userDataToSend)
        // console.log('🔐 Identity token available:', !!userDataToSend.identityToken)

        // First try to get existing user
        const response = await authenticatedFetch(
          '/api/user',
          { method: 'GET' },
          getToken
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
                email: privyUser.email?.address || privyUser.google?.email,
                walletAddress: privyUser.wallet?.address,
                username: (privyUser as any)?.google?.name || (privyUser as any)?.email?.name,
                avatar: (privyUser as any)?.google?.picture || (privyUser as any)?.email?.picture
              })
            },
            getToken
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
