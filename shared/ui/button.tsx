import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Consolidated button base styles (no longer dependent on design system patterns)
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none gap-2 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - high emphasis actions (Predict with AI)
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        // Secondary - medium emphasis actions
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        // Outline - alternative styling
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Ghost - low emphasis actions
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Legacy variants for backward compatibility
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm", // maps to primary
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Small - compact buttons
        sm: "h-8 px-3 text-sm",
        // Medium - standard buttons
        md: "h-10 px-4 text-sm",
        // Large - prominent buttons
        lg: "h-11 px-6 text-base",
        // Icon - square buttons for icons only
        icon: "h-10 w-10",
        // Legacy size for backward compatibility
        default: "h-10 px-4 text-sm", // maps to md
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
