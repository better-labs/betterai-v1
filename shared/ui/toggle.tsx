"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"

import { cn } from "@/lib/utils"

const baseToggleStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2"

const toggleVariantStyles = {
  default: "bg-transparent",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
} as const

const toggleSizeStyles = {
  default: "h-10 px-3 min-w-10",
  sm: "h-9 px-2.5 min-w-9",
  lg: "h-11 px-5 min-w-11",
} as const

export interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  variant?: keyof typeof toggleVariantStyles
  size?: keyof typeof toggleSizeStyles
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(baseToggleStyles, toggleVariantStyles[variant], toggleSizeStyles[size], className)}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

const toggleVariants = ({ 
  variant = "default", 
  size = "default", 
  className 
}: {
  variant?: keyof typeof toggleVariantStyles
  size?: keyof typeof toggleSizeStyles  
  className?: string
} = {}) => {
  return cn(
    baseToggleStyles,
    toggleVariantStyles[variant],
    toggleSizeStyles[size],
    className
  )
}

export { Toggle, toggleVariants }
