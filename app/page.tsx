import { EventTable } from "@/components/event-table"
import { Header } from "@/components/header"
import { TrendingUp, Menu } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <TrendingUp className="text-primary" />
              BetterAI
            </h1>
          <p className="text-muted-foreground text-lg  mx-auto">
            Leverage world-class AI models with enriched data to make smarter predictions on trending markets
          </p>
        </div>
        <EventTable />
      </main>
    </div>
  )
}
