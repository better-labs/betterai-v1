"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"

interface UserAuthButtonsProps {
  variant?: "desktop" | "mobile"
  className?: string
}

export function UserAuthButtons({ variant = "desktop", className = "" }: UserAuthButtonsProps) {
  const { ready, login } = usePrivy()

  const handleLogin = async () => {
    if (!ready) return
    try {
      await login()
    } catch (error) {
      console.error('Login error:', error)
      // Optionally show user-friendly error message
    }
  }

  if (variant === "desktop") {
    return (
      <div className={`hidden md:flex items-center space-x-3 bg-muted/20 rounded-lg px-3 py-1 shadow-sm ${className}`}>
        <span 
          className={`text-sm font-medium transition-colors ${
            ready 
              ? "text-primary cursor-pointer hover:text-primary/80" 
              : "text-muted-foreground cursor-not-allowed"
          }`}
          onClick={handleLogin}
        >
          {ready ? "Log In" : (
            <div className="flex items-center space-x-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!ready}
          className={`border-primary shadow-sm hover:shadow-md transition-shadow ${
            ready 
              ? "text-primary hover:bg-primary hover:text-primary-foreground" 
              : "text-muted-foreground cursor-not-allowed"
          }`}
          onClick={handleLogin}
        >
          {ready ? "Sign Up" : (
            <div className="flex items-center space-x-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </Button>
      </div>
    )
  }

  // Mobile variant
  return (
    <>
      <DropdownMenuItem 
        disabled={!ready}
        onClick={() => ready && login()}
        className="flex items-center space-x-2"
      >
        {ready ? (
          <>
            <span>Log In</span>
          </>
        ) : (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading...</span>
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem 
        disabled={!ready}
        onClick={() => ready && login()}
        className="flex items-center space-x-2"
      >
        {ready ? (
          <>
            <span>Sign Up</span>
          </>
        ) : (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading...</span>
          </>
        )}
      </DropdownMenuItem>
    </>
  )
}