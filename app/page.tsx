import { MarketTable } from "@/components/market-table"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">BetterAI</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Leverage world-class AI models with enriched data to make smarter predictions on trending markets
          </p>
        </div>
        <MarketTable />
      </main>
    </div>
  )
}
