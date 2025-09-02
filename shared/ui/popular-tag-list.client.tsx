"use client"

import { Button } from "@/shared/ui/button"
import { trpc } from "@/shared/providers/trpc-provider"

interface PopularTagsListProps {
  tags: Array<{ id: string; label: string; totalVolume?: number }>
  selectedTagId: string | null
  onTagSelect: (tagId: string | null) => void
  className?: string
}

export function PopularTagsList({ 
  tags, 
  selectedTagId, 
  onTagSelect, 
  className = "" 
}: PopularTagsListProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <div 
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" button first */}
        <Button
          variant={selectedTagId === null ? "default" : "outline"}
          size="sm"
          onClick={() => onTagSelect(null)}
          className="h-11 px-4 whitespace-nowrap flex-shrink-0 min-w-[44px] touch-manipulation"
        >
          All
        </Button>

        {/* Tag pills */}
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTagId === tag.id ? "default" : "outline"}
            size="sm"
            onClick={() => onTagSelect(tag.id)}
            className="h-11 px-4 whitespace-nowrap flex-shrink-0 min-w-[44px] touch-manipulation"
          >
            {tag.label}
          </Button>
        ))}
      </div>
    </div>
  )
}