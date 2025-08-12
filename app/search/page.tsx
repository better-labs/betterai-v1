import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Search } from "lucide-react"
import { marketQueries } from "@/lib/db/queries"
import MarketDetailsCard from "@/components/market-details-card"
import { generateMarketURL } from "@/lib/utils"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = (q || "").trim()
  const results = query
    ? await marketQueries.searchMarkets(query, { limit: 50, onlyActive: true, orderBy: "volume" })
    : []

  const marketsWithUrl = await Promise.all(
    results.map(async (m) => ({ market: m, url: await generateMarketURL(m.id) }))
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {results.length} results{query ? ` for ${query}` : ""}
          </h1>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {marketsWithUrl.map(({ market, url }) => (
              <MarketDetailsCard
                key={market.id}
                market={market}
                event={market.event}
                externalMarketUrl={url}
              />
            ))}
            {!query && (
              <Card>
                <CardContent className="p-6 text-muted-foreground">
                  Enter a search term to find markets by question, description, event title/description, or tag label.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="w-80 flex-shrink-0">
            <Card>
              <CardContent className="p-4 space-y-4">
                <form className="space-y-3" action="/search" method="get">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="q"
                      type="text"
                      placeholder="Search markets"
                      defaultValue={query}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" className="w-full">Search</Button>
                </form>
                <Separator />
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link href="/search">Clear Filters</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}