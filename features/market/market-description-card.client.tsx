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
        
        
        <p className={`text-muted-foreground ${typography.body}`}>
          {market.description}
        </p>
      </CardContent>
    </Card>
  )
}
