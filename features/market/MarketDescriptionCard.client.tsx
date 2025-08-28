'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Calendar, DollarSign, BarChart2 } from 'lucide-react'
import { formatVolume } from '@/lib/utils'
import { typography } from '@/lib/design-system'
import type { MarketDTO } from '@/lib/types'

interface MarketDescriptionCardProps {
  market: MarketDTO
}

export function MarketDescriptionCard({ market }: MarketDescriptionCardProps) {
  if (!market.description) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Market Description</CardTitle>
      </CardHeader>
      <CardContent>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Volume {formatVolume(Number(market.volume) || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Liquidity {formatVolume(Number(market.liquidity) || 0)}</span>
          </div>
          {market.endDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Market Close Date {new Date(market.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <p className={`text-muted-foreground ${typography.body}`}>
          {market.description}
        </p>
      </CardContent>
    </Card>
  )
}
