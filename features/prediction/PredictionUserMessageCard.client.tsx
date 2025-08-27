"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { USER_MESSAGE_PREFIX } from '@/lib/utils'
import { components } from '@/lib/design-system'

interface PredictionUserMessageCardProps {
  userMessage?: string | null
}

export function PredictionUserMessageCard({ userMessage }: PredictionUserMessageCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const text = userMessage || '—'

  // Extract the static guidance sentence from the prompt, if present
  let content = text
  const idx = text.indexOf(USER_MESSAGE_PREFIX)
  if (idx !== -1) {
    content = text.slice(idx + USER_MESSAGE_PREFIX.length).trimStart()
  }

  // Measure content height and determine if collapse is needed
  useEffect(() => {
    if (!contentRef.current) return

    const contentElement = contentRef.current
    const scrollHeight = contentElement.scrollHeight
    const clientHeight = contentElement.clientHeight
    
    // Check if content overflows the collapsed height (8rem = 128px)
    const collapsedHeightPx = 128
    setNeedsCollapse(scrollHeight > collapsedHeightPx)
  }, [content])

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
          <motion.div 
            ref={contentRef}
            className={components.motion.expandable.container}
            style={components.motion.expandable.textWrap}
            animate={{ 
              height: !expanded && needsCollapse ? components.motion.expandable.collapsedHeight : 'auto'
            }}
            transition={components.motion.expandable.animation}
          >
            {content}
            <AnimatePresence>
              {!expanded && needsCollapse && (
                <motion.div 
                  className={components.motion.fadeOverlay.container}
                  initial={components.motion.fadeOverlay.animation.initial}
                  animate={components.motion.fadeOverlay.animation.animate}
                  exit={components.motion.fadeOverlay.animation.exit}
                  transition={{ duration: components.motion.fadeOverlay.animation.duration }}
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
                  <span>Show less</span>
                ) : (
                  <span>Show more</span>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


