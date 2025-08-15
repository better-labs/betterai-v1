import type { Tag } from "@/lib/types"

interface PopularTagsListProps {
  tags: (Tag & { totalVolume: number })[]
}

export function PopularTagsList({ tags }: PopularTagsListProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full border border-muted-foreground/20 hover:bg-muted/70 transition-colors"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  )
}