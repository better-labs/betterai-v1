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
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onTagSelect?.(tag.id)}
              disabled={!onTagSelect}
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                isSelected
                  ? 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20'
                  : 'text-muted-foreground bg-muted/50 border-muted-foreground/20 hover:bg-muted/70'
              } ${onTagSelect ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-50`}
            >
              {tag.label}
            </button>
          )
        })}
        {isFiltered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 rounded-full hover:bg-destructive/20 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}