"use client"

import Link from 'next/link'
import { Stat } from "@/shared/ui/stat"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { formatPercent } from "@/lib/utils"
import { components, typography } from "@/lib/design-system"

interface OutcomeStatProps {
  label: string
  outcomes: string[]
  values: (number | null)[]
  tooltip?: string | null
  href?: string | null
  className?: string
  density?: "comfortable" | "compact"
  align?: "left" | "center" | "right"
  size?: "sm" | "md" | "lg"
}

export function OutcomeStat({
  label,
  outcomes,
  values,
  tooltip,
  href,
  className,
  density = "compact",
  align = "left",
  size = "md",
}: OutcomeStatProps) {
  // Inline OutcomeDisplay logic using design system tokens
  const valueClass = size === 'lg'
    ? typography.outcomeValueLg
    : size === 'md'
      ? typography.outcomeValueMd
      : typography.outcomeValue

  const labelClass = size === 'md' || size === 'lg'
    ? typography.outcomeLabelMd
    : typography.outcomeLabel

  const outcomeContent = (
    <div className={components.statsDisplay.statSpacing}>
      {outcomes.map((outcome, i) => {
        const value = values?.[i]
        return (
          <div key={i} className={components.statsDisplay.statRow}>
            <span className={`${labelClass} ${components.statsDisplay.statLabel}`}>{outcome}</span>
            <span className={`${valueClass} ${components.statsDisplay.valueText}`}>
              {value !== undefined && value !== null
                ? formatPercent(value)
                : '--'
              }
            </span>
          </div>
        )
      })}
    </div>
  )

  const statContent = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Stat
              label={label}
              value={outcomeContent}
              density={density}
              align={align}
            />
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )

  if (href) {
    return (
      <div className={className}>
        <Link href={href} className="block hover:opacity-80 transition-opacity">
          {statContent}
        </Link>
      </div>
    )
  }

  return (
    <div className={className}>
      {statContent}
    </div>
  )
}