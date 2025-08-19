"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/components/landing-page"
import { TrendingEventsTable } from "@/components/trending-events-table"
import { useEffect } from "react"
import { LoadingCard } from "@/components/ui/loading"
import { PaginatedRecentPredictions } from "@/components/paginated-recent-predictions"
import { useUser } from "@/hooks/use-user"

export function HomePageWrapper() {
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
          <LoadingCard />
        </main>
      </div>
    )
  }

  // If not authenticated, show landing page
  if (!authenticated) {
    return <LandingPage />
  }

  // If there's a user sync error, show error state
  if (userError) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
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
        </main>
      </div>
    )
  }

  // If authenticated, show regular content
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* AI Leaderboard Banner */}
          <div className="text-center bg-muted/30 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Track AI prediction accuracy.{" "}
              <a 
                href="/leaderboard" 
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                View live AI leaderboard →
              </a>
            </p>
          </div>
          
          {/* Hide trending events table for now */}
          {/* <TrendingEventsTable /> */}
          <PaginatedRecentPredictions defaultPageSize={15} />
        </div>
      </main>
    </div>
  )
}
