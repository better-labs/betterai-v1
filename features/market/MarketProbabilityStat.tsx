"use client"

import { Stat } from "@/shared/ui/stat"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { OutcomeDisplay } from "@/shared/ui/outcome-display"

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
                  <OutcomeDisplay
                    outcomes={outcomes || []}
                    values={outcomePrices || []}
                    variant="compact"
                  />
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


