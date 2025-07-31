"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const [credits, setCredits] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">BetterAI</span>
          </Link>

          {/* Navigation Section */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${
                isActive("/") 
                  ? "text-foreground border-b-2 border-primary pb-1" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Trending
            </Link>
            <Link 
              href="/market-alpha" 
              className={`text-sm font-medium transition-colors ${
                isActive("/market-alpha") 
                  ? "text-foreground border-b-2 border-primary pb-1" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Market Alpha
            </Link>
            <Link 
              href="/portfolio" 
              className={`text-sm font-medium transition-colors ${
                isActive("/portfolio") 
                  ? "text-foreground border-b-2 border-primary pb-1" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Portfolio
            </Link>
          </nav>

          {/* Actions Section */}
          <div className="flex items-center space-x-4" id="header-actions">
            {isAuthenticated ? (
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
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md transition-shadow"
                >
                  Add Funds
                </Button>
              </>
            ) : null}

            {!isAuthenticated && (
              <div className="flex items-center space-x-3 bg-muted/20 rounded-lg px-3 py-1 shadow-sm">
                <span 
                  className="text-sm font-medium text-primary cursor-pointer hover:text-primary/80 transition-colors"
                  onClick={() => setIsAuthenticated(true)}
                >
                  Log In
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setIsAuthenticated(true)}
                >
                  Sign Up
                </Button>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-lg">
                {/* Mobile Navigation Items */}
                <DropdownMenuItem asChild>
                  <Link href="/" className={`w-full ${isActive("/") ? "bg-accent" : ""}`}>
                    <span>Trending</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/market-alpha" className={`w-full ${isActive("/market-alpha") ? "bg-accent" : ""}`}>
                    <span>Market Alpha</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className={`w-full ${isActive("/portfolio") ? "bg-accent" : ""}`}>
                    <span>My Portfolio</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/activity" className={`w-full ${isActive("/activity") ? "bg-accent" : ""}`}>
                    <span>Activity</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Contact Us</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tos" className="w-full">
                    Terms of Service
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/privacy" className="w-full">
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ThemeToggle />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
