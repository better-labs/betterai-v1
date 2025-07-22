"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const [credits, setCredits] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">BetterAI</span>
          </Link>

          <div className="flex items-center space-x-4">
            
              <>
                <div className="flex items-center space-x-2 text-md">
                  <span className="text-muted-foreground font-bold">Remaining balance:</span> <span className="text-muted-foreground">$0.00</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    /* TODO: Implement add funds */
                  }}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Add Funds
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <span>Activity</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Contact Us</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/tos" className="text-muted-foreground">Terms of Service</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ThemeToggle />
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            
          </div>
        </div>
      </div>
    </header>
  )
}
