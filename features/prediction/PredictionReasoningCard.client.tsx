"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from '@/lib/utils'

interface PredictionReasoningCardProps {
  reasoning?: string | null
  className?: string
  showHeader?: boolean
}

export function PredictionReasoningCard({ 
  reasoning, 
  className, 
  showHeader = true 
}: PredictionReasoningCardProps) {
  const text = reasoning?.trim() || '—'

  return (
    <Card className={cn(className)}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Reasoning</CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'p-0'}>
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground break-words w-full">
          {text}
        </div>
      </CardContent>
    </Card>
  )
}


