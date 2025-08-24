"use client"

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchInputProps {
  defaultQuery: string
  sort: string
  status: string
  className?: string
}

export function SearchInput({ defaultQuery, sort, status, className }: SearchInputProps) {
  const [value, setValue] = useState(defaultQuery)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const submit = () => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value.trim())
    else next.delete('q')
    next.set('sort', sort)
    next.set('status', status)
    next.delete('cursor')
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  // Sync when server updates the query externally (e.g., clicking filters)
  useEffect(() => {
    if (defaultQuery !== value) setValue(defaultQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultQuery])

  // Debounced navigation on typing (instant search)
  useEffect(() => {
    const trimmed = value.trim()
    const initial = (defaultQuery || '').trim()
    // Only run when content meaningfully changes; allow clearing
    const shouldRun = trimmed.length === 0 || trimmed.length >= 2
    if (!shouldRun) return

    const handle = setTimeout(() => {
      if (trimmed === initial) return
      const currentQ = params.get('q') || ''
      if (currentQ.trim() === trimmed) return
      submit()
    }, 300)
    return () => clearTimeout(handle)
    // Include params so we compare against current URL; omit submit reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, params])

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search markets, events, tags..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          className="pl-10 pr-10"
        />
      </div>
      <Button type="button" className="w-full mt-3" onClick={submit} disabled={isPending}>
        {isPending ? 'Searching…' : 'Search'}
      </Button>
    </div>
  )
}