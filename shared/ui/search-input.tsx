"use client"

import { Search, X } from "lucide-react"
import { components } from "@/lib/design-system"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
}

export function SearchInput({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Search...",
  className 
}: SearchInputProps) {
  const id = typeof window === 'undefined' ? undefined : 'global-search-input'
  return (
    <div className={`${components.input.search.container} ${className || ''}`}>
      <Search className={components.input.search.iconLeft} />
      <input
        type="text"
        id={id}
        name={id}
        aria-label={placeholder || 'Search'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={components.input.search.input}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className={components.input.search.button}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}