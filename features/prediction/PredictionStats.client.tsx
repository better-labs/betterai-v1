"use client"

import Link from 'next/link'
import { Stat } from "@/shared/ui/stat"
import { OutcomeDisplay } from "@/shared/ui/outcome-display"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import type { PredictionDTO as Prediction } from '@/lib/types'

interface PredictionStatsProps {
  prediction: Prediction
  className?: string
}

export function PredictionStats({ prediction, className }: PredictionStatsProps) {
  const lastGeneratedLabel = prediction.createdAt 
    ? `Last generated: ${new Date(prediction.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : 'No AI prediction yet'

  return (
    <div className={className}>
      <Link 
        href={`/prediction/${prediction.id}`}
        className="block hover:opacity-80 transition-opacity"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Stat
                  label="AI Prediction"
                  value={
                    <OutcomeDisplay
                      outcomes={prediction.outcomes || []}
                      values={prediction.outcomesProbabilities || []}
                      variant="compact"
                    />
                  }
                  density="compact"
                  align="left"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lastGeneratedLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Link>
    </div>
  )
}