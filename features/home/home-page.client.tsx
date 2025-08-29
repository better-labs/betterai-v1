"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useEffect } from "react"
import { LoadingCard } from "@/shared/ui/loading"
import { useUser } from "@/hooks/use-user"
import { WelcomeBanner } from "@/features/user/welcome-banner.client"
import { PageTransition } from "@/shared/ui/transitions/page-transition.client"
import { TrendingMarkets } from "@/features/home/trending-markets.client"

export function HomePage() {
  const { ready, authenticated } = usePrivy()
  const { user, loading: userLoading, error: userError } = useUser()

  useEffect(() => {
    if (!ready || !authenticated || !user) return
  }, [ready, authenticated, user])

  // If not ready yet or user is still loading, show loading state
  if (!ready || userLoading) {
    return (
      <div className="min-h-screen bg-background" >
        <main className="container mx-auto px-4 py-8">
          <PageTransition>
            <LoadingCard />
          </PageTransition>
        </main>
      </div>
    )
  }

  // Show trending markets for both authenticated and unauthenticated users
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <PageTransition>
            <div className="space-y-8">
              <TrendingMarkets />
            </div>
          </PageTransition>
        </main>
      </div>
    )
  }

  // If there's a user sync error, show error state
  if (userError) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <PageTransition>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Account Setup Error</h2>
              <p className="text-muted-foreground mb-4">
                There was an issue setting up your account. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </PageTransition>
        </main>
      </div>
    )
  }

  // If authenticated, show regular content
  return (
    <div className="min-h-screen bg-background">
      <WelcomeBanner />
      <main className="container mx-auto px-4 py-8">
        <PageTransition>
          <div className="space-y-8">
            <TrendingMarkets />
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
