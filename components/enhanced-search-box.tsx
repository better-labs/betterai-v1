"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from 'use-debounce'
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/shared/ui/command"
import { Badge } from "@/shared/ui/badge"
import { Clock, TrendingUp, Calendar, Tag } from 'lucide-react'

interface SearchResult {
  markets: Array<{
    id: string
    question: string
    event: { title: string } | null
  }>
  events: Array<{
    id: string
    title: string
    slug: string
  }>
  tags: Array<{
    id: string
    label: string
    eventCount?: number
  }>
  totalResults: number
  suggestions?: string[]
}

interface EnhancedSearchBoxProps {
  placeholder?: string
  className?: string
  onSelect?: (type: 'market' | 'event' | 'tag', item: any) => void
  autoFocus?: boolean
}

export function EnhancedSearchBox({ 
  placeholder = "Search markets, events, tags...", 
  className,
  onSelect,
  autoFocus = false
}: EnhancedSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()
  
  // Debounce search query to avoid excessive API calls
  const [debouncedQuery] = useDebounce(query, 300)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('betterai:recent-searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }, [])

  // Search function
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setResults(data.data)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  // Save search to recent searches
  const saveSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    try {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('betterai:recent-searches', JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save recent search:', error)
    }
  }, [recentSearches])

  // Handle item selection
  const handleSelect = useCallback((type: 'market' | 'event' | 'tag', item: any) => {
    if (onSelect) {
      onSelect(type, item)
    } else {
      // Default navigation behavior
      if (type === 'market') {
        router.push(`/market/${item.id}`)
      } else if (type === 'event') {
        router.push(`/event/${item.slug}`)
      } else if (type === 'tag') {
        router.push(`/search?q=${encodeURIComponent(item.label)}`)
      }
    }
    saveSearch(query)
  }, [onSelect, router, query, saveSearch])

  // Handle recent search selection
  const handleRecentSearch = useCallback((searchTerm: string) => {
    setQuery(searchTerm)
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    saveSearch(searchTerm)
  }, [router, saveSearch])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    saveSearch(suggestion)
  }, [router, saveSearch])

  const showInitialState = !query && !results
  const showResults = query && results && results.totalResults > 0
  const showNoResults = query && results && results.totalResults === 0
  const showSuggestions = showNoResults && results?.suggestions && results.suggestions.length > 0

  return (
    <Command className={className} shouldFilter={false}>
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        autoFocus={autoFocus}
      />
      <CommandList>
        {showInitialState && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((search, index) => (
              <CommandItem
                key={index}
                onSelect={() => handleRecentSearch(search)}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isLoading && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}

        {showResults && (
          <>
            {results.markets.length > 0 && (
              <CommandGroup heading="Markets">
                {results.markets.map((market) => (
                  <CommandItem
                    key={market.id}
                    onSelect={() => handleSelect('market', market)}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{market.question}</span>
                    </div>
                    {market.event && (
                      <span className="text-sm text-muted-foreground ml-6">
                        {market.event.title}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.events.length > 0 && (
              <CommandGroup heading="Events">
                {results.events.map((event) => (
                  <CommandItem
                    key={event.id}
                    onSelect={() => handleSelect('event', event)}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span>{event.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.tags.length > 0 && (
              <CommandGroup heading="Tags">
                {results.tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleSelect('tag', tag)}
                    className="flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4 text-purple-500" />
                    <span>{tag.label}</span>
                    {tag.eventCount && tag.eventCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {tag.eventCount} events
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {showNoResults && !showSuggestions && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {showSuggestions && (
          <CommandGroup heading="Try searching for">
            {results.suggestions!.map((suggestion, index) => (
              <CommandItem
                key={index}
                onSelect={() => handleSuggestionSelect(suggestion)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{suggestion}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}