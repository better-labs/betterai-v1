"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PredictionReasoningCardProps {
  reasoning?: string | null
  className?: string
  collapsedLines?: number
}

export function PredictionReasoningCard({ reasoning, className, collapsedLines = 6 }: PredictionReasoningCardProps) {
  const [expanded, setExpanded] = useState(false)
  const text = reasoning?.trim() || '—'

  const needsCollapse = useMemo(() => {
    if (!text || text === '—') return false
    const lineCount = text.split(/\r?\n/).length
    return lineCount > collapsedLines
  }, [text, collapsedLines])

  const displayText = useMemo(() => {
    if (expanded || !needsCollapse) return text
    const lines = text.split(/\r?\n/)
    return lines.slice(0, collapsedLines).join('\n') + '…'
  }, [text, expanded, needsCollapse, collapsedLines])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reasoning || '')
    } catch {}
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Reasoning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground">{displayText}</div>
        <div className="mt-3 flex items-center gap-2">
          {needsCollapse && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
        </div>
      </CardContent>
    </Card>
  )
}


