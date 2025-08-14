"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/components/landing-page"
import { TrendingEventsTable } from "@/components/trending-events-table"
import { RecentPredictions } from "@/components/recent-predictions"
import { useEffect, useState } from "react"

export function HomePageWrapper() {
  const { ready, authenticated } = usePrivy()
  const [predictions, setPredictions] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ready || !authenticated) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/predictions/recent?limit=12`, { cache: 'no-store' })
      .then(async (res) => res.json())
      .then((data) => {
        if (!cancelled) setPredictions(Array.isArray(data?.items) ? data.items : [])
      })
      .catch(() => { if (!cancelled) setPredictions([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ready, authenticated])

  // If not ready yet, show loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
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
        {/* Recent predictions */}
        {!loading && <RecentPredictions items={predictions ?? []} />}
        {/* <TrendingEventsTable /> */}
      </main>
    </div>
  )
}
