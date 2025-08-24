"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart"
import { cn, toUnitProbability, formatPercent } from '@/lib/utils'
import { Line, LineChart } from 'recharts'

interface SparklineProps {
  values: Array<number | string | { toNumber?: () => number } | null | undefined>
  className?: string
  height?: number
  showTooltip?: boolean
}

export function Sparkline({ values, className, height = 48, showTooltip = false }: SparklineProps) {
  const data = (values || [])
    .map((v) => toUnitProbability(typeof v === 'object' && v && 'toNumber' in v ? (v as any).toNumber() : (v as any)))
    .map((v, i) => ({ index: i, value: v ?? 0 }))

  return (
    <ChartContainer
      className={cn('w-full', className)}
      style={{ height }}
      config={{ value: { label: 'Delta', color: 'hsl(var(--primary))' } }}
    >
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
        {showTooltip && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
            formatter={(val: number) => [formatPercent(val), 'Delta']}
          />
        )}
        <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}


