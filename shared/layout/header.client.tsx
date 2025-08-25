"use client"

import "./header.css"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { TrendingUp, Menu, Search, X, Twitter, Sun, Moon, Monitor, Home, Trophy, Info, BookOpen, CreditCard, Mail } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags"
import { usePrivy } from "@privy-io/react-auth"
import dynamic from "next/dynamic"
import { UserCreditsDisplay } from "@/features/user/UserCreditsDisplay.client"

// Standard Next.js dynamic import with loading state
const PrivyUserPill = dynamic(
  () => import("@privy-io/react-auth/ui").then((m) => m.UserPill),
  { 
    ssr: false,
    loading: () => <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
  }
)

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const flags = useFeatureFlags()
  const { ready, authenticated } = usePrivy()
  const { setTheme, theme } = useTheme()
 

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container mx-auto header-container">
        <div className="header-content">
          {/* Logo Section */}
          <div className="header-logo-section">
            <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105 duration-200">
              <TrendingUp className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold text-foreground">BetterAI</span>
            </Link>

            {/* Navigation Section */}
            <nav className="header-nav hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <Link 
                href="/leaderboard" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/leaderboard") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Leaderboard
              </Link>
              <Link 
                href="/about" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/about") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                About
              </Link>
              <Link 
                href="/docs" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/docs") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Docs
              </Link>
              

              {/* {flags.showPortfolio && (
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
              )} */}
            </nav>
          </div>

          {/* Right side elements - directly in grid */}
          <div className="flex items-center justify-end gap-3">
            {/* Search Bar Section - Hidden on mobile */}
            {flags.showSearch && (
              <div className="header-search hidden md:flex">
                <form onSubmit={handleSearch} className="relative w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search markets"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
            {/* Credits Display */}
            <div className="credit-display  md:flex ">
              {ready && authenticated ? (
                <UserCreditsDisplay />
              ) : (
                <div className="w-20 h-6 bg-muted/30 rounded animate-pulse" />
              )}
            </div>

            {/* Auth section */}
            <div className="flex items-center justify-center w-24 h-8">
              {ready ? (
                <PrivyUserPill />
              ) : (
                <div className="w-full h-full bg-muted/50 rounded animate-pulse" />
              )}
            </div>

            {/* Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-lg">
                {/* Mobile Search */}
                {flags.showSearch && (
                  <>
                    <div className="p-2">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search markets"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-8 h-8 text-sm"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </form>
                    </div>
                    
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Mobile Navigation Items */}
                <DropdownMenuItem asChild>
                  <Link href="/" className={`w-full flex items-center space-x-2 ${isActive("/") ? "bg-accent" : ""}`}>
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className={`w-full flex items-center space-x-2 ${isActive("/leaderboard") ? "bg-accent" : ""}`}>
                    <Trophy className="h-4 w-4" />
                    <span>AI Leaderboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about" className={`w-full flex items-center space-x-2 ${isActive("/about") ? "bg-accent" : ""}`}>
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs" className={`w-full flex items-center space-x-2 ${isActive("/docs") ? "bg-accent" : ""}`}>
                    <BookOpen className="h-4 w-4" />
                    <span>Docs</span>
                  </Link>
                </DropdownMenuItem>

                {/* {flags.showPortfolio && (
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className={`w-full ${isActive("/portfolio") ? "bg-accent" : ""}`}>
                      <span>My Portfolio</span>
                    </Link>
                  </DropdownMenuItem>
                )} */}
                
                
                {/* App Features Section */}
                <DropdownMenuSeparator />
                {flags.showActivity && (
                  <DropdownMenuItem asChild>
                    <Link href="/activity" className={`w-full ${isActive("/activity") ? "bg-accent" : ""}`}>
                      <span>Activity</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {authenticated && (
                  <DropdownMenuItem asChild>
                    <Link href="/credits" className={`w-full flex items-center space-x-2 ${isActive("/credits") ? "bg-accent" : ""}`}>
                      <CreditCard className="h-4 w-4" />
                      <span>Credits</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {/* Support & Social Section */}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Contact Us</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://x.com/HelloBetterAI" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-2">
                    <Twitter className="h-4 w-4" />
                    <span>Follow us on X</span>
                  </Link>
                </DropdownMenuItem>
                
                {/* Settings & Legal Section */}
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                      {theme === "light" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                      {theme === "dark" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>System</span>
                      {theme === "system" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Legal</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href="/privacy" className={`w-full ${isActive("/privacy") ? "bg-accent" : ""}`}>
                        <span>Privacy Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tos" className={`w-full ${isActive("/tos") ? "bg-accent" : ""}`}>
                        <span>Terms of Service</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}