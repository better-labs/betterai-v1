"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PredictionUserMessageCardProps {
  userMessage?: string | null
}

export function PredictionUserMessageCard({ userMessage }: PredictionUserMessageCardProps) {
  const text = userMessage || '—'

  // Extract the static guidance sentence from the prompt, if present
  const USER_MESSAGE_PREFIX = 'Please consider the additional information below on market context, timing, and any relevant factors when making your prediction.'
  let guidance: string | null = null
  let content = text
  const idx = text.indexOf(USER_MESSAGE_PREFIX)
  if (idx !== -1) {
    guidance = USER_MESSAGE_PREFIX
    content = text.slice(idx + USER_MESSAGE_PREFIX.length).trimStart()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userMessage || '')
    } catch {}
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Prediction Prompt Message</CardTitle>
          <CardDescription>
            You can copy this message and try it with your preferred AI provider.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
      </CardHeader>
      <CardContent>
        
          <div className="mb-4 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>
        
      </CardContent>
    </Card>
  )
}


