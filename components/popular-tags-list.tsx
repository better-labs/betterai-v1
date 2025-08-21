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
    <div className="mb-4 hidden sm:block">
      {/* Filter bar with subtle styling - hidden on mobile */}
      <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
        <div className="flex flex-wrap gap-2 items-center justify-start">
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
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
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
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}