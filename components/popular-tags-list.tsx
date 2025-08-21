"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Tag } from "@/lib/types"

interface PopularTagsListProps {
  tags: (Tag & { totalVolume: number })[]
  selectedTagIds?: string[]
  onTagSelect?: (tagId: string) => void
  onClearFilters?: () => void
  isFiltered?: boolean
}

export function PopularTagsList({ 
  tags, 
  selectedTagIds = [], 
  onTagSelect, 
  onClearFilters, 
  isFiltered = false 
}: PopularTagsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (!tags || tags.length === 0) {
    return null
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <div className="hidden sm:block">
      {/* Horizontal scrollable filter bar */}
      <div className="bg-muted/30 rounded-lg border border-border/40 relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1 hover:bg-muted/50 transition-colors shadow-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1 hover:bg-muted/50 transition-colors shadow-sm"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide py-3 px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-2 items-center justify-start min-w-max">
            <span className="text-xs font-medium text-muted-foreground mr-2 whitespace-nowrap">
              Filter by:
            </span>
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => onTagSelect?.(tag.id)}
                  disabled={!onTagSelect}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'text-primary-foreground bg-primary border-primary shadow-sm'
                      : 'text-muted-foreground bg-background border-border hover:bg-muted/50 hover:text-foreground'
                  } ${onTagSelect ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-50`}
                >
                  {tag.label}
                </button>
              )
            })}
            {isFiltered && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors ml-2 whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}