"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/shared/ui/button"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompactUserPillProps {
  className?: string
  showFullOnDesktop?: boolean
}

export function CompactUserPill({ className, showFullOnDesktop = false }: CompactUserPillProps) {
  const { ready, authenticated, login, user } = usePrivy()

  if (!ready) {
    return <div className="w-8 h-8 bg-muted/50 rounded-full animate-pulse" />
  }

  if (!authenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={login}
        className={cn("h-8 px-2 text-xs", className)}
      >
        <User className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">Sign In</span>
      </Button>
    )
  }

  // Get user display info
  const getDisplayName = () => {
    if (user?.email?.address) {
      return user.email.address.split('@')[0]
    }
    if (user?.phone?.number) {
      return user.phone.number.slice(-4)
    }
    if (user?.wallet?.address) {
      return `${user.wallet.address.slice(0, 6)}...`
    }
    return "User"
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-8 px-2 text-xs font-medium", className)}
      onClick={() => {
        // Open user menu or profile - you can customize this
        console.log("User clicked")
      }}
    >
      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs mr-1">
        {getInitials()}
      </div>
      <span className={cn(
        "hidden", 
        showFullOnDesktop && "md:inline"
      )}>
        {getDisplayName()}
      </span>
    </Button>
  )
}