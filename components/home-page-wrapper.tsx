"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/components/landing-page"
import { TrendingEventsTable } from "@/components/trending-events-table"
import { RecentPredictions } from "@/components/recent-predictions"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { LoadingCard } from "@/components/ui/loading"

export function HomePageWrapper() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [predictions, setPredictions] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ready || !authenticated) return
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
  }, [ready, authenticated, getAccessToken])

  // If not ready yet, show loading state
  if (!ready) {
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
