"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [credits, setCredits] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-[#4B9CD3]" />
            <span className="text-xl font-bold text-black">BetterAI</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Remaining balance: $0.00</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    /* TODO: Implement add funds */
                  }}
                  className="border-[#4B9CD3] text-[#4B9CD3] hover:bg-[#4B9CD3] hover:text-white"
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
                      <span>Legal</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Activity</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Contact Us</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">Remaining balance: $0.00</span>
                <Button variant="ghost" size="sm" onClick={() => setIsLoggedIn(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
