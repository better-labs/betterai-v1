"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { RecentPredictions } from "@/components/recent-predictions"
import { LoadingCard } from "@/shared/ui/loading"
import { type SortMode } from "@/components/trending-selector"
import { useQuery } from "@tanstack/react-query"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/shared/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

type PaginatedRecentPredictionsProps = {
  defaultPageSize?: number
}

export function PaginatedRecentPredictions({ defaultPageSize = 15 }: PaginatedRecentPredictionsProps) {
  const { getAccessToken } = usePrivy()
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)
  const [cursorHistory, setCursorHistory] = useState<Array<number | null>>([null])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('markets') // Always start with default

  const currentCursor = cursorHistory[cursorHistory.length - 1] ?? null
  const currentPage = cursorHistory.length

  // Load sort mode from localStorage on client after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prediction-sort-mode')
      if (saved === 'predictions' || saved === 'markets') {
        setSortMode(saved as SortMode)
      }
    }
  }, [])

  const handleSortModeChange = useCallback((newSortMode: SortMode) => {
    setSortMode(newSortMode)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('prediction-sort-mode', newSortMode)
    }
  }, [])

  // Build query key for TanStack Query
  const queryKey = useMemo(() => [
    'recent-predictions',
    currentCursor,
    pageSize,
    selectedTagIds.join(','),
    sortMode
  ], [currentCursor, pageSize, selectedTagIds, sortMode])

  // Fetch function for TanStack Query
  const fetchPredictions = useCallback(async () => {
    const accessToken = await getAccessToken()
    const url = new URL("/api/predictions/recent", window.location.origin)
    url.searchParams.set("limit", String(pageSize))
    if (currentCursor != null) url.searchParams.set("cursor", String(currentCursor))
    if (selectedTagIds.length > 0) url.searchParams.set("tagIds", selectedTagIds.join(','))
    if (sortMode) url.searchParams.set("sort", sortMode)

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  }, [getAccessToken, pageSize, currentCursor, selectedTagIds, sortMode])

  // Use TanStack Query
  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchPredictions,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth errors
  })

  const items = data?.items || []
  const nextCursor = data?.nextCursor || null
  const isFiltered = selectedTagIds.length > 0
  const canGoBack = cursorHistory.length > 1
  const canGoNext = nextCursor != null

  // Reset to first page when filters change
  useEffect(() => {
    setCursorHistory([null])
  }, [pageSize, selectedTagIds, sortMode])

  const handleNext = useCallback(() => {
    if (!canGoNext || nextCursor == null) return
    const newHistory = [...cursorHistory, nextCursor]
    setCursorHistory(newHistory)
  }, [canGoNext, nextCursor, cursorHistory])

  const handlePrevious = useCallback(() => {
    if (!canGoBack) return
    const newHistory = cursorHistory.slice(0, cursorHistory.length - 1)
    setCursorHistory(newHistory)
  }, [canGoBack, cursorHistory])

  const handleGoToPage = useCallback((pageIndex: number) => {
    // pageIndex is 1-based
    const newHistory = cursorHistory.slice(0, pageIndex)
    setCursorHistory(newHistory)
  }, [cursorHistory])

  // Tag filtering functions
  const handleTagSelect = useCallback((tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedTagIds([])
  }, [])

  const pageSizeOptions = useMemo(() => [10, 15, 20, 30, 50], [])

  return (
    <section className="space-y-3">
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <div className="border rounded-lg p-4 text-sm text-destructive bg-card">
          {error instanceof Error ? error.message : 'Failed to load predictions'}
        </div>
      ) : (
        <RecentPredictions 
          items={items} 
          selectedTagIds={selectedTagIds}
          onTagSelect={handleTagSelect}
          onClearFilters={handleClearFilters}
          isFiltered={isFiltered}
          sortMode={sortMode}
          onSortModeChange={handleSortModeChange}
        />
      )}

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="text-sm text-muted-foreground whitespace-nowrap">Page size</div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-[110px] sm:w-[110px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((sz) => (
                  <SelectItem key={sz} value={String(sz)}>
                    {sz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e: any) => { e.preventDefault(); handlePrevious() }}
                  aria-disabled={!canGoBack}
                  className={!canGoBack ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>

              {Array.from({ length: currentPage }).map((_, idx) => {
                const pageNumber = idx + 1
                const isActive = pageNumber === currentPage
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={isActive}
                      onClick={(e: any) => { e.preventDefault(); handleGoToPage(pageNumber) }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {canGoNext && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={(e: any) => { e.preventDefault(); handleNext() }}
                  aria-disabled={!canGoNext}
                  className={!canGoNext ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div />
        </div>
      </div>
    </section>
  )
}


