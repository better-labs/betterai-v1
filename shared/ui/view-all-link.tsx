"use client"

import { cn } from "@/lib/utils"

interface ViewAllLinkProps {
  href: string
  children: React.ReactNode
  variant?: 'base' | 'muted' | 'accessible'
  external?: boolean
  className?: string
  'data-debug-id'?: string
}

export function ViewAllLink({
  href,
  children,
  variant = 'accessible',
  external = false,
  className,
  'data-debug-id': debugId
}: ViewAllLinkProps) {
  // Extracted styles from design system - now self-contained
  const baseStyles = {
    base: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors',
    muted: 'text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors',
    accessible: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  }

  const linkClasses = cn(baseStyles[variant], className)

  if (external) {
    return (
      <a
        href={href}
        className={linkClasses}
        target="_blank"
        rel="noopener noreferrer"
        data-debug-id={debugId}
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href={href}
      className={linkClasses}
      data-debug-id={debugId}
    >
      {children}
    </a>
  )
}
