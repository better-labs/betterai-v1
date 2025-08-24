"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PredictionReasoningCardProps {
  reasoning?: string | null
  className?: string
  collapsedHeight?: string
  showHeader?: boolean
}

export function PredictionReasoningCard({ 
  reasoning, 
  className, 
  collapsedHeight = '6rem',
  showHeader = true 
}: PredictionReasoningCardProps) {
  const [expanded, setExpanded] = useState(false)
  const text = reasoning?.trim() || '—'

  const needsCollapse = useMemo(() => {
    if (!text || text === '—') return false
    return text.length > 200 // Collapse if text is longer than 200 characters
  }, [text])

  return (
    <Card className={cn(className)}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Reasoning</CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'p-0'}>
        <div 
          className={cn(
            "whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground relative",
            !expanded && needsCollapse && "overflow-hidden",
          )}
          style={{ 
            maxHeight: !expanded && needsCollapse ? collapsedHeight : 'none'
          }}
        >
          {text}
          {!expanded && needsCollapse && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>
        {needsCollapse && (
          <div className="mt-3 flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded((v) => !v)}
              className="text-xs h-auto p-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


