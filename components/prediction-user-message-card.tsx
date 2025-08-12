"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ClipboardCopyIcon, CheckIcon } from 'lucide-react'
import { USER_MESSAGE_PREFIX } from '@/lib/utils'

interface PredictionUserMessageCardProps {
  userMessage?: string | null
}

export function PredictionUserMessageCard({ userMessage }: PredictionUserMessageCardProps) {
  const text = userMessage || '—'

  // Extract the static guidance sentence from the prompt, if present
  
  let content = text
  const idx = text.indexOf(USER_MESSAGE_PREFIX)
  if (idx !== -1) {
    
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
          <CardTitle>Verifiable Prediction Prompt</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground">
          The text below was sent to the AI model to generate this prediction. To verify the prediction you can copy and paste the prompt exactly as shown below into your AI provider of choice.
        </div>
        <div className="relative rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] text-foreground shadow-sm hover:bg-muted/50"
                  aria-label="Copy prompt"
                >
                  <ClipboardCopyIcon className="h-3 w-3" />
                  Copy
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {content}
        </div>
      </CardContent>
    </Card>
  )
}


