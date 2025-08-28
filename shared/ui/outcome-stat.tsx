"use client"

import Link from 'next/link'
import { Stat } from "@/shared/ui/stat"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { formatPercent } from "@/lib/utils"

interface OutcomeStatProps {
  label: string
  outcomes: string[]
  values: (number | null)[]
  tooltip?: string | null
  href?: string | null
  className?: string
  density?: "comfortable" | "compact"
  align?: "left" | "center" | "right"
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
}: OutcomeStatProps) {
  // Inline OutcomeDisplay logic (always uses compact variant)
  const outcomeContent = (
    <div className="space-y-1">
      {outcomes.map((outcome, i) => {
        const value = values?.[i]
        return (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <span className="truncate">{outcome}</span>
            <span className="font-semibold tabular-nums">
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