"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { TrendingUp, Menu, Search, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags"
import { usePrivy } from "@privy-io/react-auth"
import dynamic from "next/dynamic"

const PrivyUserPill = dynamic(
  () => import("@privy-io/react-auth/ui").then((m) => m.UserPill),
  { ssr: false }
)

export function Header() {
  const [credits, setCredits] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const flags = useFeatureFlags()
  const { ready, authenticated } = usePrivy()

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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold text-foreground">BetterAI</span>
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
                Home
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
                href="/privacy" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/privacy") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Privacy
              </Link>
              <Link 
                href="/tos" 
                className={`text-sm font-medium transition-colors ${
                  isActive("/tos") 
                    ? "text-foreground border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Terms
              </Link>
              {/* {flags.showMarketAlpha && (
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
              )} */}
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

          {/* Search Bar Section - Hidden on mobile */}
          {flags.showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-12">
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

          {/* Actions Section */}
          <div className="flex items-center space-x-4" id="header-actions">
            {authenticated && (
              <>
                <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
                  <span>Remaining credits:</span>
                  <span className="font-medium">{credits}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push("/credits")
                  }}
                  className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
                >
                  Add Credits
                </Button>
              </>
            )}

            {/* Login/Signup buttons removed; relying solely on Privy UserPill */}

            <PrivyUserPill />

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
                  <Link href="/" className={`w-full ${isActive("/") ? "bg-accent" : ""}`}>
                    <span>Home</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about" className={`w-full ${isActive("/about") ? "bg-accent" : ""}`}>
                    <span>About</span>
                  </Link>
                </DropdownMenuItem>
                {/* {flags.showMarketAlpha && (
                  <DropdownMenuItem asChild>
                    <Link href="/market-alpha" className={`w-full ${isActive("/market-alpha") ? "bg-accent" : ""}`}>
                      <span>Market Alpha</span>
                    </Link>
                  </DropdownMenuItem>
                )} */}
                {/* {flags.showPortfolio && (
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className={`w-full ${isActive("/portfolio") ? "bg-accent" : ""}`}>
                      <span>My Portfolio</span>
                    </Link>
                  </DropdownMenuItem>
                )} */}
                
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
                    <Link href="/credits" className={`w-full ${isActive("/credits") ? "bg-accent" : ""}`}>
                      <span>Credits</span>
                    </Link>
                  </DropdownMenuItem>
                )}
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
                <DropdownMenuItem>
                  <span>Contact Us</span>
                </DropdownMenuItem>
                {/* Mobile Login/Signup removed; relying solely on Privy UserPill */}
                
                <ThemeToggle />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
