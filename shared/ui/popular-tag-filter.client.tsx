"use client"

import { Button } from "@/shared/ui/button"
import { Filter, X } from "lucide-react"
import { trpc } from "@/shared/providers/trpc-provider"
import { components } from "@/lib/design-system"

interface TagFilterProps {
  selectedTag: string | null
  onTagChange: (tag: string | null) => void
}

export function TagFilter({ selectedTag, onTagChange }: TagFilterProps) {
  // Use tRPC to fetch popular tags
  const { data, isLoading } = trpc.tags.getPopular.useQuery(
    { limit: 8 },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const popularTags = data?.data || []

  if (isLoading || popularTags.length === 0) {
    return null
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter by category</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTag === null ? "default" : "outline"}
          size="sm"
          onClick={() => onTagChange(null)}
          className={components.tagFilter.height}
        >
          All Categories
        </Button>

        {popularTags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTag === tag.label ? "default" : "outline"}
            size="sm"
            onClick={() => onTagChange(tag.label)}
            className={components.tagFilter.height}
          >
            {tag.label}
            {selectedTag === tag.label && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
