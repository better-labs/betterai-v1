"use client"

import Link from 'next/link'
import { Stat } from "@/shared/ui/stat"
import { OutcomeDisplay } from "@/shared/ui/outcome-display"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"

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
  const statContent = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Stat
              label={label}
              value={
                <OutcomeDisplay
                  outcomes={outcomes}
                  values={values}
                  variant="compact"
                />
              }
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