"use client"

import { Stat } from "@/shared/ui/stat"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { components } from "@/lib/design-system"
import { formatPercent } from "@/lib/utils"

interface MarketProbabilityStatProps {
  outcomes?: string[] | null
  outcomePrices?: number[] | null
  label?: string
  tooltip?: string | null
  className?: string
}

export function MarketProbabilityStat({
  outcomes,
  outcomePrices,
  label = "Market Probability",
  tooltip,
  className,
}: MarketProbabilityStatProps) {
  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Stat
                label={label}
                value={
                  <div className={components.outcome.container}>
                    {(outcomes || []).map((outcome, i) => (
                      <div key={i} className={components.outcome.row}>
                        <span className={components.outcome.label}>{outcome}</span>
                        <span className={components.outcome.value}>
                          {formatPercent(outcomePrices?.[i])}
                        </span>
                      </div>
                    ))}
                  </div>
                }
                density="compact"
                align="left"
              />
            </div>
          </TooltipTrigger>
          {tooltip ? (
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}


