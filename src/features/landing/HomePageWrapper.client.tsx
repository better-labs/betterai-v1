"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/src/features/landing/LandingPage"
import { TrendingEventsTable } from "@/src/features/event/trending-events-table"
import { useEffect } from "react"
import { LoadingCard } from "@/src/shared/ui/loading"
import { PaginatedRecentPredictions } from "@/src/features/prediction/PaginatedRecentPredictions"
import { useUser } from "@/hooks/use-user"
import { WelcomeBanner } from "@/src/shared/layout/WelcomeBanner"
import { PageTransition } from "@/src/shared/layout/PageTransition"
import { TrendingUp, Activity, Target, Trophy } from "lucide-react"

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
          <PageTransition>
            <LoadingCard />
          </PageTransition>
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
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <TrendingUp className="text-primary" />
                Today's Top AI Market Predictions
              </h1>
              <p className="text-muted-foreground text-lg  mx-auto mb-6">
                AI-powered predictions on trending markets. Get insights from multiple models with enriched data analysis.
              </p>
            </div>
              

            {/* Hide trending events table for now */}
            {/* <TrendingEventsTable /> */}
            <PaginatedRecentPredictions defaultPageSize={15} />
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
