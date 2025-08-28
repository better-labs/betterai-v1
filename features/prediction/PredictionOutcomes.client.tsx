"use client"

import { OutcomeStat } from "@/shared/ui/outcome-stat"

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
    <OutcomeStat
      label={title}
      outcomes={outcomes}
      values={probabilities}
      className={className}
    />
  )
}