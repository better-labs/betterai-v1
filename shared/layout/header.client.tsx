"use client"

import "./header.css"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { TrendingUp, Menu, Twitter, Sun, Moon, Monitor, Home, Trophy, Info, BookOpen, CreditCard, Mail, Activity } from "lucide-react"
import { SearchInput } from "@/shared/ui/search-input"
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
        <div className="header-content" data-testid="header-content">
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
            
              

            </nav>
          </div>

          {/* Right side elements - directly in grid */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Search Bar Section - Hidden on mobile */}
            <div className="header-search hidden md:flex flex-1 max-w-sm">
              <form onSubmit={handleSearch} className="w-full">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={clearSearch}
                  placeholder="Search markets"
                />
              </form>
            </div>
            
            {/* Credits Display */}
            {/* <div className="credit-display  md:flex ">
              {ready && authenticated ? (
                <UserCreditsDisplay />
              ) : (
                <div className="w-20 h-6 bg-muted/30 rounded animate-pulse" />
              )}
            </div> */}

            {/* Auth section */}
            <div className="flex items-center justify-center min-w-0 flex-shrink-0">
              {ready ? (
                <PrivyUserPill />
              ) : (
                <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
              )}
            </div>

            {/* Menu */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 px-3 shadow-sm hover:shadow-md transition-shadow">
                      <Menu className="h-7 w-7" />
                    </Button>
                  </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg">
                {/* Mobile Search */}
                {/* {flags.showSearch && (
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
                )} */}
                
                {/* Mobile Navigation Items */}
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home className="h-5 w-5 flex-shrink-0" />
                    <span>Home</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard">
                    <Trophy className="h-5 w-5 flex-shrink-0" />
                    <span>AI Leaderboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <span>About</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.betterai.tools" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-5 w-5 flex-shrink-0" />
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
                    <Link href="/activity">
                      <Activity className="h-5 w-5 flex-shrink-0" />
                      <span>Activity</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {authenticated && (
                  <DropdownMenuItem asChild>
                    <Link href="/credits">
                      <CreditCard className="h-5 w-5 flex-shrink-0" />
                      <span>Credits</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {/* Support & Social Section */}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <span>Contact Us</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://x.com/HelloBetterAI" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5 flex-shrink-0" />
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
                    <DropdownMenuItem onClick={() => setTheme("light")} className="">
                      <Sun className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span>Light</span>
                      {theme === "light" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="">
                      <Moon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span>Dark</span>
                      {theme === "dark" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="">
                      <Monitor className="mr-3 h-5 w-5 flex-shrink-0" />
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
                      <Link href="/privacy">
                        <span>Privacy Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tos">
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
      </div>
             <div className="mobile-search" data-testid="mobile-search">
         <div className="container mx-auto">
           <form onSubmit={handleSearch} className="w-full">
             <SearchInput
               value={searchQuery}
               onChange={setSearchQuery}
               onClear={clearSearch}
               placeholder="Search markets"
             />
           </form>
         </div>
       </div>
    </header>
  )
}