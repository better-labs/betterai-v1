"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { components } from '@/lib/design-system'
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
            components.collapsible.container,
            !expanded && needsCollapse && components.collapsible.collapsed,
          )}
          style={{ 
            maxHeight: !expanded && needsCollapse ? collapsedHeight : 'none',
            ...components.collapsible.textWrap
          }}
        >
          {text}
          {!expanded && needsCollapse && (
            <div className={components.collapsible.fadeOverlay.card} />
          )}
        </div>
        {needsCollapse && (
          <div className="mt-3 flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded((v) => !v)}
              className="text-sm"
            >
              {expanded ? (
                <span>Show less</span>
              ) : (
                <span>Show more</span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


