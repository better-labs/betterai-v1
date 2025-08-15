"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { RecentPredictions } from "@/components/recent-predictions"
import { LoadingCard } from "@/components/ui/loading"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PaginatedRecentPredictionsProps = {
  defaultPageSize?: number
}

export function PaginatedRecentPredictions({ defaultPageSize = 15 }: PaginatedRecentPredictionsProps) {
  const { getAccessToken } = usePrivy()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)
  const [cursorHistory, setCursorHistory] = useState<Array<number | null>>([null])
  const [nextCursor, setNextCursor] = useState<number | null>(null)

  const currentCursor = cursorHistory[cursorHistory.length - 1] ?? null
  const canGoBack = cursorHistory.length > 1
  const canGoNext = nextCursor != null
  const currentPage = cursorHistory.length

  const fetchPage = useCallback(async (cursor: number | null, limit: number) => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      const url = new URL("/api/predictions/recent", window.location.origin)
      url.searchParams.set("limit", String(limit))
      if (cursor != null) url.searchParams.set("cursor", String(cursor))

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

      const data = await response.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
      setNextCursor(typeof data?.nextCursor === "number" ? data.nextCursor : null)
    } catch (e: any) {
      setError(e?.message || "Failed to load predictions")
      setItems([])
      setNextCursor(null)
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  // Initial load and whenever page size changes, reset to first page
  useEffect(() => {
    setCursorHistory([null])
    fetchPage(null, pageSize)
  }, [pageSize, fetchPage])

  const handleNext = useCallback(() => {
    if (!canGoNext || nextCursor == null) return
    const newHistory = [...cursorHistory, nextCursor]
    setCursorHistory(newHistory)
    fetchPage(nextCursor, pageSize)
  }, [canGoNext, nextCursor, cursorHistory, fetchPage, pageSize])

  const handlePrevious = useCallback(() => {
    if (!canGoBack) return
    const newHistory = cursorHistory.slice(0, cursorHistory.length - 1)
    const prevCursor = newHistory[newHistory.length - 1] ?? null
    setCursorHistory(newHistory)
    fetchPage(prevCursor, pageSize)
  }, [canGoBack, cursorHistory, fetchPage, pageSize])

  const handleGoToPage = useCallback((pageIndex: number) => {
    // pageIndex is 1-based
    const targetCursor = cursorHistory[pageIndex - 1] ?? null
    const newHistory = cursorHistory.slice(0, pageIndex)
    setCursorHistory(newHistory)
    fetchPage(targetCursor, pageSize)
  }, [cursorHistory, fetchPage, pageSize])

  const pageSizeOptions = useMemo(() => [10, 15, 20, 30, 50], [])

  return (
    <section className="space-y-3">
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <div className="border rounded-lg p-4 text-sm text-destructive bg-card">{error}</div>
      ) : (
        <RecentPredictions items={items} />
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


