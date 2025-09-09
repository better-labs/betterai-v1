"use client"

import { Button } from "@/shared/ui/button"
import { trpc } from "@/shared/providers/trpc-provider"
import { components } from "@/lib/design-system"

interface PopularTagsListProps {
  tags: Array<{ id: string; label: string; totalVolume?: number }>
  selectedTagId: string | null
  onTagSelect: (tagId: string | null) => void
}

export function PopularTagsList({ 
  tags, 
  selectedTagId, 
  onTagSelect 
}: PopularTagsListProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    
      <div 
        className={components.tagFilter.scrollContainer}
        style={components.tagFilter.scrollbarHide}
        data-debug-id="popular-tag-list"
      >
        {/* "All" button first */}
        <Button
          variant={selectedTagId === null ? "default" : "outline"}
          size="sm"
          onClick={() => onTagSelect(null)}
          className={`${components.tagFilter.buttonHeight} ${components.tagFilter.button}`}
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
            className={`${components.tagFilter.buttonHeight} ${components.tagFilter.button}`}
          >
            {tag.label}
          </Button>
        ))}
      </div>
    
  )
}