'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { components } from '@/lib/design-system'

interface TextCollapseProps {
  children: string
  maxLength?: number
  previewLines?: number
  showMoreText?: string
  showLessText?: string
  className?: string
}

export function TextCollapse({
  children,
  maxLength = 150,
  previewLines,
  showMoreText = "Show more",
  showLessText = "Show less",
  className = ""
}: TextCollapseProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!children) return null

  const shouldTruncate = children.length > maxLength
  const previewText = shouldTruncate ? children.slice(0, maxLength).trim() + "..." : children

  if (!shouldTruncate) {
    return (
      <div className={`${components.textCollapse.content} ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div className={components.textCollapse.container}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isExpanded ? 'expanded' : 'collapsed'}
          initial={{ opacity: 0, height: 'auto' }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 'auto' }}
          transition={{
            duration: components.textCollapse.animation.duration,
            ease: components.textCollapse.animation.ease
          }}
          className={`${components.textCollapse.content} ${
            !isExpanded && previewLines ? components.textCollapse.truncated : ''
          } ${className}`}
        >
          {isExpanded ? children : previewText}
        </motion.div>
      </AnimatePresence>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={components.textCollapse.toggleButton}
        type="button"
      >
        {isExpanded ? showLessText : showMoreText}
      </button>
    </div>
  )
}