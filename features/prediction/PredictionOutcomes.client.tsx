"use client"

import { Badge } from "@/shared/ui/badge"
import { formatPercent } from '@/lib/utils'

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
      <h4 className="text-sm font-medium mb-2">{title}:</h4>
      <div className="space-y-1">
        {outcomes.map((outcome, index) => (
          <div key={outcome} className="flex justify-between text-sm">
            <span>{outcome}</span>
            <Badge variant="outline">
              {formatPercent(probabilities[index] || 0)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}