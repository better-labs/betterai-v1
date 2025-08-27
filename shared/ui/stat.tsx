// shared/ui/stat.tsx
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "positive" | "caution" | "critical"
type Density = "comfortable" | "compact"

const toneClasses: Record<Tone,string> = {
  neutral: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  caution:  "text-amber-600 dark:text-amber-400",
  critical: "text-rose-600 dark:text-rose-400",
}

const valueSize: Record<Density,string> = {
  comfortable: "text-5xl md:text-6xl",
  compact: "text-3xl md:text-4xl",
}

export function Stat({
  label,
  value,
  helpText,
  tooltip,
  icon,
  tone = "neutral",
  density = "comfortable",
  align = "center",
  className,
}: {
  label: string
  value: React.ReactNode
  helpText?: React.ReactNode
  tooltip?: string
  icon?: React.ReactNode
  tone?: Tone
  density?: Density
  align?: "left" | "center" | "right"
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", align === "center" && "items-center", align === "right" && "items-end", className)}>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 opacity-70 hover:opacity-100 hover:bg-muted/50 rounded p-0.5 transition-all" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 text-xs bg-background border-border shadow-lg">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className={cn("mt-1 font-semibold tabular-nums leading-none", toneClasses[tone], valueSize[density])}>
        {value}
      </div>

      {helpText && <div className="mt-1 text-xs text-muted-foreground">{helpText}</div>}
    </div>
  )
}

// shared/ui/stat-group.tsx
export function StatGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-[repeat(auto-fit,minmax(160px,1fr))]",
      className
    )}>
      {children}
    </div>
  )
}
