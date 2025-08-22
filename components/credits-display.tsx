'use client'

import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { CreditBalance } from "@/lib/services/credit-manager"
import { usePrivy } from "@privy-io/react-auth"
import { authenticatedFetch } from "@/lib/utils"

interface CreditsDisplayProps {
  showAddButton?: boolean
  compact?: boolean
}

export function CreditsDisplay({ showAddButton = true, compact = false }: CreditsDisplayProps) {
  const { user, isAuthenticated, isReady } = useUser()
  const { getAccessToken } = usePrivy()

	// Fetch user credits
	const { data: creditsData, isLoading } = useQuery({
		queryKey: ['user-credits', user?.id],
		queryFn: async (): Promise<{ credits: CreditBalance | null; isAuthenticated: boolean; message?: string }> => {
			if (!isAuthenticated) {
				return {
					credits: null,
					isAuthenticated: false,
					message: 'User not authenticated'
				}
			}

			const accessToken = await getAccessToken()
			if (!accessToken) {
				throw new Error('No access token available')
			}

			const getToken = () => Promise.resolve(accessToken)
			const response = await authenticatedFetch('/api/user/credits', { method: 'GET' }, getToken)
			
			if (!response.ok) {
				throw new Error('Failed to fetch credits')
			}
			return response.json()
		},
		enabled: isReady && isAuthenticated, // Only fetch when authenticated
		refetchInterval: 60000, // Refetch every minute
		staleTime: 30000, // Consider data stale after 30 seconds
	})

	const credits = creditsData?.credits

  if (!user?.id || !isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!credits) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-sm">
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">{credits.credits}</span>
        </div>
        {credits.credits < 10 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        <span>Credits:</span>
        <span className="font-medium text-foreground">{credits.credits}</span>
      </div>

      {credits.credits < 10 && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Credits
        </Badge>
      )}

      {showAddButton && credits.credits < 10 && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href="/credits">
            Add Credits
          </Link>
        </Button>
      )}
    </div>
  )
}
