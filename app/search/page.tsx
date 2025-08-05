"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  X, 
  TrendingUp, 
  Droplets, 
  Flame, 
  RotateCcw, 
  Clock, 
  Trophy,
  ChevronRight,
  MessageCircle,
  DollarSign,
  Calendar
} from "lucide-react"
import { Market } from "@/lib/types"
import { formatVolume } from "@/lib/utils"

// Mock search results data
const mockSearchResults: Market[] = [
  {
    id: "1",
    question: "Will Trump pardon Ghislaine Maxwell by August 31?",
    description: null,
    eventId: null,
    slug: null,
    outcomePrices: ["0.03", "0.97"],
    outcomes: ["Yes", "No"],
    volume: "191000",
    liquidity: "0",
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date()
  },
  {
    id: "2", 
    question: "Who will leave Trump Administration in 2025?",
    description: null,
    eventId: null,
    slug: null,
    outcomePrices: ["0.26", "0.74"],
    outcomes: ["Dan Bongino", "Others"],
    volume: "45000",
    liquidity: "0",
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date()
  },
  {
    id: "3",
    question: "Will Epstein list be released by end of 2024?",
    description: null,
    eventId: null,
    slug: null,
    outcomePrices: ["0.21", "0.79"],
    outcomes: ["Yes", "No"],
    volume: "125000",
    liquidity: "0",
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date()
  },
  {
    id: "4",
    question: "Will Trump face Epstein-related charges?",
    description: null,
    eventId: null,
    slug: null,
    outcomePrices: ["0.13", "0.87"],
    outcomes: ["Yes", "No"],
    volume: "89000",
    liquidity: "0",
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date()
  },
  {
    id: "5",
    question: "Will Maxwell cooperate with prosecutors?",
    description: null,
    eventId: null,
    slug: null,
    outcomePrices: ["0.08", "0.92"],
    outcomes: ["Yes", "No"],
    volume: "67000",
    liquidity: "0",
    category: null,
    active: true,
    closed: false,
    startDate: null,
    endDate: null,
    resolutionSource: null,
    updatedAt: new Date()
  }
]

const sortOptions = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "liquidity", label: "Liquidity", icon: Droplets },
  { id: "volume", label: "Volume", icon: Flame },
  { id: "newest", label: "Newest", icon: RotateCcw },
  { id: "ending", label: "Ending soon", icon: Clock },
  { id: "competitive", label: "Competitive", icon: Trophy }
]

const filterTags = [
  "All", "Earn 4%", "Ghislaine Maxwell", "Maxwell", "Trump Vs Elon", 
  "List", "Kash Patel", "FBI", "Cabinet", "Trump Presid"
]

function SearchPageContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [selectedSort, setSelectedSort] = useState("trending")
  const [selectedStatus, setSelectedStatus] = useState("active")
  const [selectedTag, setSelectedTag] = useState("All")
  const [results, setResults] = useState<Market[]>([])

  useEffect(() => {
    // Simulate search results based on query
    if (query) {
      const filtered = mockSearchResults.filter(market => 
        market.question.toLowerCase().includes(query.toLowerCase()) ||
        market.question.toLowerCase().includes("epstein") ||
        market.question.toLowerCase().includes("maxwell")
      )
      setResults(filtered)
    } else {
      setResults(mockSearchResults)
    }
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const url = new URL(window.location.href)
      url.searchParams.set("q", searchQuery.trim())
      window.history.pushState({}, "", url.toString())
      // Trigger a page refresh to update the search
      window.location.reload()
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearFilters = () => {
    setSelectedSort("trending")
    setSelectedStatus("active")
    setSelectedTag("All")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Search Results Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {results.length} results for {query}
          </h1>
          
          {/* Filter Tags */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {filterTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedTag === tag 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search Results */}
            <div className="space-y-4">
              {results.map((market) => (
                <Card key={market.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Market Avatar */}
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      {/* Market Content */}
                      <div className="flex-1 min-w-0">
                        {/* Category */}
                        <div className="text-xs text-muted-foreground mb-1">
                          Politics {market.question.toLowerCase().includes("trump") ? "> Trump" : "> Epstein"}
                        </div>
                        
                        {/* Question */}
                        <h3 className="font-medium text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
                          {market.question}
                        </h3>
                        
                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>{formatVolume(Number(market.volume) || 0)} Vol.</span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            <span>19</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Percentage and Arrow */}
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            {market.outcomePrices?.[0] ? Math.round(Number(market.outcomePrices[0]) * 100) : 0}%
                          </div>
                          {market.question.toLowerCase().includes("administration") && (
                            <div className="text-xs text-muted-foreground">Dan Bongino</div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardContent className="p-4 space-y-6">
                {/* Search Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search markets"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSearch}>
                    <Button type="submit" className="w-full">
                      Search
                    </Button>
                  </form>
                </div>

                <Separator />

                {/* Sort Options */}
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">Sort by</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <Button
                          key={option.id}
                          variant={selectedSort === option.id ? "default" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => setSelectedSort(option.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Event Status */}
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">Event Status</h3>
                  <div className="space-y-2">
                    {["Active", "Resolved", "All"].map((status) => (
                      <Button
                        key={status}
                        variant={selectedStatus === status.toLowerCase() ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedStatus(status.toLowerCase())}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Clear Filters */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
} 