'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import Fuse from 'fuse.js'
import { usePostHog } from 'posthog-js/react'
import { Input } from '@/src/shared/ui/input'
import { DocNavItem, docsNavigation } from '@/lib/docs-data'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function DocSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const posthog = usePostHog()
  
  const fuse = useMemo(() => {
    return new Fuse(docsNavigation, {
      keys: ['title', 'section'],
      threshold: 0.3,
      includeMatches: true,
    })
  }, [])
  
  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).slice(0, 5)
  }, [fuse, query])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0)
    
    if (value.length > 2 && posthog) {
      posthog.capture('search_query', {
        query: value,
        results_count: results.length,
      })
    }
  }
  
  const handleResultClick = () => {
    setQuery('')
    setIsOpen(false)
  }
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('[data-search-container]')) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  
  return (
    <div className="relative" data-search-container>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search docs..."
          value={query}
          onChange={handleInputChange}
          className="pl-8 w-64"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-50">
          <div className="p-2">
            {results.map((result) => (
              <Link
                key={result.item.slug}
                href={`/docs/${result.item.slug}`}
                onClick={handleResultClick}
                className={cn(
                  'block px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted',
                  'border-b border-border last:border-b-0'
                )}
              >
                <div className="font-medium">{result.item.title}</div>
                {result.item.section && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {result.item.section}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-50">
          <div className="p-3 text-sm text-muted-foreground">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  )
}