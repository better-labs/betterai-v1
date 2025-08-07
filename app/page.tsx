import { EventTable } from "@/components/event-table"
import { RecentPredictions } from "@/components/recent-predictions"
import { TrendingUp, Menu, Target, Brain, BarChart3 } from "lucide-react"
import { predictionQueries } from "@/lib/db/queries"

export default async function HomePage() {
  const items = await predictionQueries.getRecentPredictionsWithRelations(12)
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Recent predictions */}
        <RecentPredictions items={items} />
      </main>
    </div>
  )
}
