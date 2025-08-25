'use client'

import { useUser } from "@/hooks/use-user"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { CreditCard, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/shared/providers/trpc-provider"

interface UserCreditsDisplayProps {
  showAddButton?: boolean
  compact?: boolean
}

export function UserCreditsDisplay({ showAddButton = true, compact = false }: UserCreditsDisplayProps) {
  const { user, isAuthenticated, isReady } = useUser()

  // Use tRPC to fetch user credits - wait for both Privy and user to be ready
  const { data: creditsData, isLoading } = trpc.users.getCredits.useQuery(
    {},
    {
      enabled: isReady && isAuthenticated && !!user?.id,
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // Consider data stale after 30 seconds
      refetchOnWindowFocus: false,
    }
  )

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
      <Link 
        href="/credits"
        className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <CreditCard className="h-4 w-4" />
        <span>&nbsp;Credits:&nbsp;</span>
        <span className="font-medium text-foreground">{credits.credits}</span>
      </Link>

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