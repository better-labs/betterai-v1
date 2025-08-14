"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/components/landing-page"
import { TrendingEventsTable } from "@/components/trending-events-table"
import { RecentPredictions } from "@/components/recent-predictions"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { LoadingCard } from "@/components/ui/loading"
import { useUser } from "@/hooks/use-user"

export function HomePageWrapper() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { user, loading: userLoading, error: userError } = useUser()
  const [predictions, setPredictions] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ready || !authenticated || !user) return
    let cancelled = false
    setLoading(true)
    
    // Get access token and make authenticated request
    const fetchPredictions = async () => {
      try {
        const accessToken = await getAccessToken()
        const response = await fetch(`/api/predictions/recent?limit=12`, { 
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication failed - user may need to re-authenticate')
            // Could trigger re-authentication here if needed
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        if (!cancelled) setPredictions(Array.isArray(data?.items) ? data.items : [])
      } catch (error) { 
        console.error('Failed to fetch predictions:', error)
        if (!cancelled) setPredictions([]) 
      } finally { 
        if (!cancelled) setLoading(false) 
      }
    }
    
    fetchPredictions()
    return () => { cancelled = true }
  }, [ready, authenticated, user, getAccessToken])

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
          <TrendingEventsTable />
          <RecentPredictions items={predictions ?? []} />
        </div>
      </main>
    </div>
  )
}
