import * as React from "react"

import { cn } from "@/lib/utils"

const baseBadgeStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

const badgeVariantStyles = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
} as const

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariantStyles
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn(baseBadgeStyles, badgeVariantStyles[variant], className)} {...props} />
  )
}

const badgeVariants = ({ 
  variant = "default", 
  className 
}: {
  variant?: keyof typeof badgeVariantStyles
  className?: string
} = {}) => {
  return cn(
    baseBadgeStyles,
    badgeVariantStyles[variant],
    className
  )
}

export { Badge, badgeVariants }
