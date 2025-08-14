"use client"

import { usePrivy } from "@privy-io/react-auth"
import { LandingPage } from "@/components/landing-page"
import { TrendingEventsTable } from "@/components/trending-events-table"
import { RecentPredictions } from "@/components/recent-predictions"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

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
        {loading ? (
          <section aria-labelledby="recent-predictions-heading" className="mt-8">
            <h2 id="recent-predictions-heading" className="text-lg font-semibold mb-4">Recent AI Predictions</h2>
            <div className="border rounded-lg p-12 text-center bg-card">
              <div className="flex items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-2xl font-semibold text-muted-foreground">Loading recent predictions…</div>
              </div>
            </div>
          </section>
        ) : (
          <RecentPredictions items={predictions ?? []} />
        )}
        {/* <TrendingEventsTable /> */}
      </main>
    </div>
  )
}
