import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Calendar, Tag } from "lucide-react"
import { searchQueries, marketQueries } from "@/lib/db/queries"
import MarketDetailsCard from "@/features/market/MarketCard"
import { generateMarketURL } from "@/lib/utils"
import { SearchInput } from "@/components/search-input"

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; cursor?: string; sort?: string; status?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, cursor, sort = 'trending', status = 'active' } = await searchParams
  const query = (q || "").trim()
  
  // Use unified search for all entity types (serialized version)
  const results = query
    ? await searchQueries.searchAllSerialized(query, {
        includeMarkets: true,
        includeEvents: true,
        includeTags: true,
        limit: 20,
        marketOptions: {
          sort: (sort as any) ?? 'trending',
          status: (status as any) ?? 'active',
          cursorId: cursor ?? null,
          limit: 20
        }
      })
    : { markets: [], events: [], tags: [], totalResults: 0, suggestions: [] }

  const marketsWithUrl = await Promise.all(
    results.markets.map(async (m) => ({ market: m, url: await generateMarketURL(m.id) }))
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {query ? (
              `${results.totalResults} result${results.totalResults === 1 ? "" : "s"} for "${query}"`
            ) : (
              "Search BetterAI"
            )}
          </h1>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            {/* Markets Section */}
            {marketsWithUrl.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Markets ({marketsWithUrl.length})
                </h2>
                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Events Section */}
            {results.events.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Events ({results.events.length})
                </h2>
                <div className="grid gap-4">
                  {results.events.map((event) => (
                    <Card key={event.id} className="hover:bg-muted/30 transition-colors">
                      <CardContent className="p-4">
                        <Link 
                          href={`/event/${event.slug}`}
                          className="block hover:text-primary transition-colors"
                        >
                          <h3 className="font-medium">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {results.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-500" />
                  Tags ({results.tags.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((tag) => (
                    <Link 
                      key={tag.id}
                      href={`/search?q=${encodeURIComponent(tag.label)}`}
                    >
                      <Badge 
                        variant="outline" 
                        className="hover:bg-muted transition-colors cursor-pointer"
                      >
                        {tag.label}
                        {tag.eventCount && tag.eventCount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({tag.eventCount})
                          </span>
                        )}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && results.totalResults === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    No results found for "{query}"
                  </p>
                  {results.suggestions && results.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {results.suggestions.map((suggestion, index) => (
                          <Link key={index} href={`/search?q=${encodeURIComponent(suggestion)}`}>
                            <Badge variant="secondary" className="hover:bg-muted cursor-pointer">
                              {suggestion}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!query && (
              <Card>
                <CardContent className="p-6 text-muted-foreground">
                  Enter a search term to find markets, events, and tags. You can search by:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Market questions and descriptions</li>
                    <li>Event titles and descriptions</li>
                    <li>Tag labels</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="w-80 flex-shrink-0">
            <Card>
              <CardContent className="p-4 space-y-4">
                <SearchInput defaultQuery={query} sort={String(sort)} status={String(status)} />
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