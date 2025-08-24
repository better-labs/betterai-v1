"use client"

import { Badge } from "@/shared/ui/badge"
import { Trophy, Medal, Award, Target, Activity, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LeaderboardEntry {
  modelName: string
  totalPredictions: number
  resolvedPredictions: number
  correctPredictions: number
  accuracyRate: number
  avgConfidenceInWinner: number
  lastPredictionAt: Date
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-semibold">{rank}</span>
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return "text-green-600"
    if (accuracy >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getModelDisplayName = (modelName: string) => {
    // Clean up model names for display
    return modelName
      .replace(/^(openai|google|anthropic|deepseek|meta)\//, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const getProviderBadge = (modelName: string) => {
    const provider = modelName.split('/')[0]
    const colors: Record<string, string> = {
      'openai': 'bg-green-100 text-green-800',
      'google': 'bg-blue-100 text-blue-800',
      'anthropic': 'bg-orange-100 text-orange-800',
      'deepseek': 'bg-purple-100 text-purple-800',
      'meta': 'bg-blue-100 text-blue-800',
      'microsoft': 'bg-cyan-100 text-cyan-800',
    }
    
    return (
      <Badge variant="secondary" className={`text-xs ${colors[provider] || 'bg-gray-100 text-gray-800'}`}>
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
      </Badge>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground">
          No AI models have made predictions on resolved markets yet, or none match the selected filter.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left p-4 font-semibold">Rank</th>
              <th className="text-left p-4 font-semibold">AI Model</th>
              <th className="text-center p-4 font-semibold">Accuracy</th>
              <th className="text-center p-4 font-semibold">Resolved</th>
              <th className="text-center p-4 font-semibold">Total</th>
              <th className="text-center p-4 font-semibold">Confidence</th>
              <th className="text-center p-4 font-semibold">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => {
              const rank = index + 1
              const accuracy = entry.accuracyRate
              const hasResolvedPredictions = entry.resolvedPredictions > 0

              return (
                <tr key={entry.modelName} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(rank)}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {getModelDisplayName(entry.modelName)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getProviderBadge(entry.modelName)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    {hasResolvedPredictions ? (
                      <div className="space-y-1">
                        <div className={`font-bold text-lg ${getAccuracyColor(accuracy)}`}>
                          {(accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.correctPredictions}/{entry.resolvedPredictions}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <span className="text-xs">No resolved</span>
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{entry.resolvedPredictions}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{entry.totalPredictions}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    {hasResolvedPredictions ? (
                      <div className="font-medium">
                        {(entry.avgConfidenceInWinner * 100).toFixed(0)}%
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(entry.lastPredictionAt), { addSuffix: true })}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}