"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"

interface Tag {
  id: string
  label: string
  slug?: string | null
}

interface TagFilterProps {
  selectedTag: string | null
  onTagChange: (tag: string | null) => void
}

export function TagFilter({ selectedTag, onTagChange }: TagFilterProps) {
  const [popularTags, setPopularTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const response = await fetch('/api/tags/popular?limit=8')
        if (response.ok) {
          const data = await response.json()
          setPopularTags(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch popular tags:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularTags()
  }, [])

  if (loading || popularTags.length === 0) {
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
          className="h-8"
        >
          All Categories
        </Button>
        
        {popularTags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTag === tag.label ? "default" : "outline"}
            size="sm"
            onClick={() => onTagChange(tag.label)}
            className="h-8"
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