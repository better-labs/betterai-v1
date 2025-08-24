"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type SortMode = "markets" | "predictions"

interface TrendingSelectorProps {
  value: SortMode
  onValueChange: (value: SortMode) => void
  className?: string
}

export function TrendingSelector({ value, onValueChange, className }: TrendingSelectorProps) {
  return (
    <div className={`flex justify-center transition-all duration-200 ${className?.includes('flex-shrink-0') ? 'mb-0' : 'mb-3'} ${className || ""}`}>
      <ToggleGroup 
        type="single" 
        value={value}
        onValueChange={(newValue) => newValue && onValueChange(newValue as SortMode)}
        className="bg-muted rounded-lg p-1 shadow-sm border"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ToggleGroupItem 
                  value="predictions" 
                  className="px-3 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm rounded-md transition-all duration-200 hover:bg-muted-foreground/10"
                >
                  Recent Predictions
                </ToggleGroupItem>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              <p className="text-xs">
                Shows predictions sorted by AI signal strength and disagreement with market odds
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ToggleGroupItem 
                  value="markets" 
                  className="px-3 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm rounded-md transition-all duration-200 hover:bg-muted-foreground/10"
                >
                  Trending Markets
                </ToggleGroupItem>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              <p className="text-xs">
                Shows predictions sorted by market trading volume for markets with AI predictions in the last 24 hours
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ToggleGroup>
    </div>
  )
}