"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/src/shared/ui/alert"
import { Button } from "@/src/shared/ui/button"
import { X, Info } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"

export function WelcomeBanner() {
  const { user, isAuthenticated, isReady } = useUser()
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if banner should be shown
  const shouldShowBanner = () => {
    if (!isReady || !isAuthenticated || !user || isDismissed) {
      return false
    }

    // Check localStorage for manual dismissal first
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('betterai:welcome-banner-dismissed')
      if (dismissed) {
        return false
      }
    }

    // Show banner for new users (created within last 7 days) or users who haven't dismissed it
    if (user.createdAt) {
      const createdDate = new Date(user.createdAt)
      const now = new Date()
      const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Show banner if user was created within last 7 days
      return daysSinceCreation <= 7
    }

    // If no createdAt date, assume it's a new user and show the banner
    return true
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Store dismissal in localStorage to persist across sessions
    if (typeof window !== 'undefined') {
      localStorage.setItem('betterai:welcome-banner-dismissed', 'true')
    }
  }

  // Load dismissal state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('betterai:welcome-banner-dismissed')
      if (dismissed) {
        setIsDismissed(true)
      }
    }
  }, [])

  if (!shouldShowBanner()) {
    return null
  }

  return (
    <div className="flex justify-center pt-4">
      <div className="w-auto max-w-5xl">
        <Alert className="border-primary/20 bg-primary/5 text-foreground">
          <Info className="h-4 w-4 text-primary" />
          <div className="flex items-start justify-between">
            <AlertDescription className="flex-1 pr-4">
              Welcome to BetterAI!
              {" "} {" "}
              Learn about{" "}
              <Link
                href="/docs/overview/what-is-betterai"
                className="text-primary underline hover:no-underline font-medium transition-colors"
              >
                What is BetterAI
              </Link>
              {" "}and{" "}
              <Link
                href="/docs/overview/prediction-markets"
                className="text-primary underline hover:no-underline font-medium transition-colors"
              >
                What are Prediction Markets
              </Link>
              {" "}in our docs, or start browsing below to get started.
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={handleDismiss}
              aria-label="Dismiss welcome banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  )
}