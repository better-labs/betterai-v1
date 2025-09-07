"use client"

import "./header.css"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Menu, Twitter, Sun, Moon, Monitor, Home, Trophy, Info, BookOpen, CreditCard, Mail, Activity } from "lucide-react"
import Image from "next/image"
import { SearchInput } from "@/shared/ui/search-input"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags"
import { usePrivy } from "@privy-io/react-auth"
import dynamic from "next/dynamic"
import { UserCreditsDisplay } from "@/features/user/UserCreditsDisplay.client"
import { components, typography } from "@/lib/design-system"

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
      <div className={`container mx-auto ${components.header.outerContainer}`}>
        <div className={components.header.container} data-testid="header-content">
          {/* Logo Section */}
          <div className={components.header.logoSection}>
            <Link href="/" className={`${components.header.logoLink} ${components.effects.hoverScale}`}>
              <Image 
                src="/icon/betterai-icon.png" 
                alt="BetterAI Logo" 
                width={40} 
                height={40} 
                className="h-11 w-11 flex-shrink-0"
              />
              <span className={components.header.logoText}>BetterAI</span>
            </Link>

            {/* Navigation Section */}
            <nav className={components.header.nav.container}>
              <Link 
                href="/" 
                className={`${typography.navLarge} ${components.effects.hoverScale}`}
              >
                Home
              </Link>
              <Link 
                href="/leaderboard" 
                className={`${typography.navLarge} ${components.effects.hoverScale}`}
              >
                AI Leaderboard
              </Link>
              <Link 
                href="/about" 
                className={`${typography.navLarge} ${components.effects.hoverScale}`}
              >
                About
              </Link>
            
              

            </nav>
          </div>

          {/* Right side elements - directly in grid */}
          <div className={components.header.rightSection} data-testid="navbar-right-section">
            {/* Search Bar Section - Hidden on mobile */}
            <div className={components.header.search.container} data-testid="navbar-search">
              <form onSubmit={handleSearch} className={components.header.search.form}>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={clearSearch}
                  placeholder="Search markets"
                />
              </form>
            </div>
            
            {/* Credits Display */}
            {/* <div className="credit-display  md:flex " data-testid="navbar-credits">
              {ready && authenticated ? (
                <UserCreditsDisplay />
              ) : (
                <div className="w-20 h-6 bg-muted/30 rounded animate-pulse" />
              )}
            </div> */}

            {/* Auth section - Hide UserPill when authenticated */}
            <div className={components.header.auth.container} data-testid="navbar-auth">
              {ready ? (
                !authenticated && <PrivyUserPill />
              ) : (
                <div className={components.header.auth.loading} />
              )}
            </div>

            {/* Menu */}
            <div className={components.header.menu.container} data-testid="navbar-menu">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`h-10 px-2 shadow-md hover:shadow-lg dark:shadow-xl dark:shadow-black/20 dark:border dark:border-white/10 transition-all ${components.button.menu.largeIcon}`}>
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" alignOffset={0} className="w-56 shadow-lg">
                
                {/* User Profile Section - Show when authenticated */}
                {ready && authenticated && (
                  <>
                    <div className="p-2">
                      <PrivyUserPill />
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                
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
             <div className={components.header.search.mobile} data-testid="mobile-search">
         
           <form onSubmit={handleSearch} className={components.header.search.form}>
             <SearchInput
               value={searchQuery}
               onChange={setSearchQuery}
               onClear={clearSearch}
               placeholder="Search markets"
             />
           </form>
         </div>
       
    </header>
  )
}