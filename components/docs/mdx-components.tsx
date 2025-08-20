'use client'

import { useState } from 'react'
import { Check, Copy, AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CalloutProps {
  type?: 'tip' | 'warn' | 'info'
  children: React.ReactNode
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const styles = {
    tip: {
      container: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
      icon: <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />,
    },
    warn: {
      container: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
    },
    info: {
      container: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
      icon: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    },
  }
  
  const style = styles[type]
  
  return (
    <div className={cn('border rounded-lg p-4 my-4', style.container)}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {style.icon}
        </div>
        <div className="flex-1 text-sm">
          {children}
        </div>
      </div>
    </div>
  )
}

interface StepProps {
  n: number
  children: React.ReactNode
}

export function Step({ n, children }: StepProps) {
  return (
    <div className="flex gap-4 my-4">
      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
        {n}
      </div>
      <div className="flex-1 pt-1">
        {children}
      </div>
    </div>
  )
}

interface CodeProps {
  children: string
  className?: string
}

export function Code({ children, className }: CodeProps) {
  const [copied, setCopied] = useState(false)
  const posthog = usePostHog()
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    if (posthog) {
      posthog.capture('copy_code', {
        code_length: children.length,
        language: className?.replace('language-', '') || 'unknown',
      })
    }
  }
  
  const isCodeBlock = className?.includes('language-')
  
  if (!isCodeBlock) {
    return (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
        {children}
      </code>
    )
  }
  
  return (
    <div className="relative group">
      <pre className={cn('rounded-lg border bg-muted p-4 overflow-x-auto', className)}>
        <code>{children}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}

interface TagProps {
  children: React.ReactNode
}

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
      {children}
    </span>
  )
}

export const mdxComponents = {
  Callout,
  Step,
  code: Code,
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tag,
}