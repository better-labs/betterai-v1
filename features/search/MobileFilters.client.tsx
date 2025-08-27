"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Card, CardContent } from "@/shared/ui/card"
import { SearchInput } from "@/features/search/SearchInput.client"

interface MobileFiltersProps {
  defaultQuery: string
  sort: string
  status: string
}

export function MobileFilters({ defaultQuery, sort, status }: MobileFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (defaultQuery) params.set('q', defaultQuery)
    params.set('sort', newSort)
    params.set('status', status)
    params.delete('cursor')
    router.push(`/search?${params.toString()}`)
  }

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (defaultQuery) params.set('q', defaultQuery)
    params.set('sort', sort)
    params.set('status', newStatus)
    params.delete('cursor')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="lg:hidden mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <SearchInput defaultQuery={defaultQuery} sort={sort} status={status} className="w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="liquidity">Liquidity</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="ending">Ending soon</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Closed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}