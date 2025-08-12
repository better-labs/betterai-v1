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
import { SearchBox } from "@/components/search-box"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; cursor?: string; sort?: string; status?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, cursor, sort = 'trending', status = 'active' } = await searchParams
  const query = (q || "").trim()
  const { items, nextCursor } = query
    ? await marketQueries.searchMarkets(query, {
        limit: 20,
        sort: (sort as any) ?? 'trending',
        status: (status as any) ?? 'active',
        cursorId: cursor ?? null,
      })
    : { items: [], nextCursor: null }

  const marketsWithUrl = await Promise.all(
    items.map(async (m) => ({ market: m, url: await generateMarketURL(m.id) }))
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {`Showing ${marketsWithUrl.length} result${marketsWithUrl.length === 1 ? "" : "s"}${query ? ` for ${query}` : ""}`}
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
                latestPrediction={market.predictions?.[0] ?? null}
                className="hover:bg-muted/30 transition-colors"
                href={`/market/${market.id}`}
              />
            ))}
            {nextCursor && (
              <div className="pt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/search?${new URLSearchParams({ q: query, sort: String(sort), status: String(status), cursor: nextCursor }).toString()}`}>
                    Load more
                  </Link>
                </Button>
              </div>
            )}
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
                <SearchBox defaultQuery={query} sort={String(sort)} status={String(status)} />
                <Separator />
                {/* Sort options */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { id: 'trending', label: 'Trending' },
                      { id: 'liquidity', label: 'Liquidity' },
                      { id: 'volume', label: 'Volume' },
                      { id: 'newest', label: 'Newest' },
                      { id: 'ending', label: 'Ending soon' },
                      { id: 'competitive', label: 'Competitive' },
                    ].map((opt) => {
                      const params = new URLSearchParams({ q: query, sort: opt.id, status: String(status) })
                      const href = `/search?${params.toString()}`
                      const isActive = String(sort) === opt.id
                      return (
                        <Button key={opt.id} asChild size="sm" variant={isActive ? 'default' : 'outline'}>
                          <Link href={href}>{opt.label}</Link>
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <Separator />
                {/* Status filters */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { id: 'active', label: 'Active' },
                      { id: 'resolved', label: 'Closed' },
                      { id: 'all', label: 'All' },
                    ].map((opt) => {
                      const params = new URLSearchParams({ q: query, sort: String(sort), status: opt.id })
                      const href = `/search?${params.toString()}`
                      const isActive = String(status) === opt.id
                      return (
                        <Button key={opt.id} asChild size="sm" variant={isActive ? 'default' : 'outline'}>
                          <Link href={href}>{opt.label}</Link>
                        </Button>
                      )
                    })}
                  </div>
                </div>
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