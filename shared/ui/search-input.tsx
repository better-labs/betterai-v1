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
  return (
    <div className={`${components.input.search.container} ${className || ''}`}>
      {/* Left slot */}
      <div className={components.input.search.iconLeft}>
        <Search className="h-4 w-4" />
      </div>

      {/* Input */}
      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={components.input.search.input}
      />

      {/* Right slot */}
      {value && (
        <div className={components.input.search.iconRight}>
          <button
            type="button"
            onClick={onClear}
            className={components.input.search.button}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}