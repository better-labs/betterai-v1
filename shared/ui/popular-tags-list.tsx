"use client"

import { useRef, useState, useEffect } from "react"
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
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  if (!tags || tags.length === 0) {
    return null
  }

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const canScrollLeftValue = container.scrollLeft > 5 // Add small buffer
    const canScrollRightValue = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5) // Add small buffer
    
    setCanScrollLeft(canScrollLeftValue)
    setCanScrollRight(canScrollRightValue)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    updateScrollButtons()

    // Add scroll event listener
    container.addEventListener('scroll', updateScrollButtons)
    
    // Add resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(updateScrollButtons)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      resizeObserver.disconnect()
    }
  }, [tags])

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
      {/* Container with arrows outside */}
      <div className="flex items-center gap-2">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="flex-shrink-0 bg-background border rounded p-1 hover:bg-muted shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Scrollable filter bar */}
        <div className="flex-1 bg-muted/30 rounded-lg border border-border/40 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide py-3 px-4"
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

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="flex-shrink-0 bg-background border rounded p-1 hover:bg-muted shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}