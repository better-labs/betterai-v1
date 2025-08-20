"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

export type SortMode = "markets" | "predictions"

interface TrendingSelectorProps {
  value: SortMode
  onValueChange: (value: SortMode) => void
  className?: string
}

export function TrendingSelector({ value, onValueChange, className }: TrendingSelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex justify-center mb-6">
        <div className="bg-muted rounded-xl p-1 h-10 w-80 animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`flex justify-center mb-6 transition-all duration-200 ${className || ""}`}>
      <ToggleGroup 
        type="single" 
        value={value}
        onValueChange={(newValue) => newValue && onValueChange(newValue as SortMode)}
        className="bg-muted rounded-xl p-1 shadow-sm border"
      >
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <ToggleGroupItem 
              value="markets" 
              className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm rounded-lg transition-all duration-200 hover:bg-muted-foreground/10"
            >
              Trending Markets
            </ToggleGroupItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64">
                <p className="text-xs">
                  Shows predictions sorted by market trading volume for markets with AI predictions in the last 24 hours
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <ToggleGroupItem 
              value="predictions" 
              className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm rounded-lg transition-all duration-200 hover:bg-muted-foreground/10"
            >
              Trending Predictions
            </ToggleGroupItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64">
                <p className="text-xs">
                  Shows predictions sorted by AI signal strength and disagreement with market odds
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </ToggleGroup>
    </div>
  )
}