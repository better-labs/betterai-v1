"use client"

import { Stat } from "@/shared/ui/stat"
import { OutcomeDisplay } from "@/shared/ui/outcome-display"

interface PredictionOutcomesProps {
  outcomes: string[]
  probabilities: number[]
  title?: string
  className?: string
}

export function PredictionOutcomes({ 
  outcomes, 
  probabilities, 
  title = "Predicted Probabilities",
  className 
}: PredictionOutcomesProps) {
  return (
    <div className={className}>
      <Stat
        label={title}
        value={
          <OutcomeDisplay
            outcomes={outcomes}
            values={probabilities}
            variant="compact"
          />
        }
        density="compact"
        align="left"
      />
    </div>
  )
}