"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/shared/ui/card'
import { Button } from '@/src/shared/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/shared/ui/tooltip'
import { ClipboardCopyIcon, CheckIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { USER_MESSAGE_PREFIX, cn } from '@/lib/utils'

interface PredictionUserMessageCardProps {
  userMessage?: string | null
}

export function PredictionUserMessageCard({ userMessage }: PredictionUserMessageCardProps) {
  const [expanded, setExpanded] = useState(false)
  const text = userMessage || '—'

  // Extract the static guidance sentence from the prompt, if present
  let content = text
  const idx = text.indexOf(USER_MESSAGE_PREFIX)
  if (idx !== -1) {
    content = text.slice(idx + USER_MESSAGE_PREFIX.length).trimStart()
  }

  const needsCollapse = useMemo(() => {
    return content.length > 400 // Collapse if content is longer than 400 characters
  }, [content])

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
        <div className="relative rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] text-foreground shadow-sm hover:bg-muted/50 z-10"
                  aria-label="Copy prompt"
                >
                  <ClipboardCopyIcon className="h-3 w-3" />
                  Copy
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <motion.div 
            className="whitespace-pre-wrap relative overflow-hidden"
            animate={{ 
              height: !expanded && needsCollapse ? '8rem' : 'auto'
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeInOut"
            }}
          >
            {content}
            <AnimatePresence>
              {!expanded && needsCollapse && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/20 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
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
        </div>
      </CardContent>
    </Card>
  )
}


