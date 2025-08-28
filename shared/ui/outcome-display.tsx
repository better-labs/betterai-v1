"use client"

import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/utils"

interface OutcomeDisplayProps {
  outcomes: string[]
  values?: (number | null)[]
  variant?: 'default' | 'compact'
  className?: string
  formatAsPercent?: boolean
}

export function OutcomeDisplay({
  outcomes,
  values,
  variant = 'default',
  className,
  formatAsPercent = true
}: OutcomeDisplayProps) {
  // Extracted styles from design system - now self-contained
  const containerClass = 'space-y-1'

  const rowClass = variant === 'compact'
    ? 'flex items-center gap-2  px-2 py-1.5'
    : 'flex items-center gap-3  px-3 py-2'

  const labelClass = 'truncate'
  const valueClass = 'font-semibold tabular-nums'

  return (
    <div className={cn(containerClass, className)}>
      {outcomes.map((outcome, i) => {
        const value = values?.[i]

        return (
          <div key={i} className={rowClass}>
            <span className={labelClass}>{outcome}</span>
            <span className={valueClass}>
              {value !== undefined && value !== null && formatAsPercent
                ? formatPercent(value)
                : '--'
              }
            </span>
          </div>
        )
      })}
    </div>
  )
}
