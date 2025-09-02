"use client"

import { useState, useMemo } from "react"
import { LeaderboardTable } from "@/features/leaderboard/LeaderboardTable"
import { TagFilter } from "@/shared/ui/popular-tag-filter.client"
import { LoadingCard } from "@/shared/ui/loading"
import { TrendingUp, Trophy, Target, Activity } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { trpc } from "@/shared/providers/trpc-provider"

interface LeaderboardEntry {
  modelName: string
  totalPredictions: number
  resolvedPredictions: number
  correctPredictions: number
  accuracyRate: number
  avgConfidenceInWinner: number
  lastPredictionAt: Date
}

interface LeaderboardStats {
  totalModels: number
  totalPredictions: number
  averageAccuracy: number
  resolvedMarkets: number
}

export function LeaderboardWrapper() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Use tRPC to fetch leaderboard data
  const { data, isLoading, error, refetch } = trpc.leaderboard.getLeaderboard.useQuery(
    { tag: selectedTag || undefined },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Extract leaderboard data and calculate stats
  const leaderboard = data?.data?.leaderboard || []
  
  const stats = useMemo((): LeaderboardStats | null => {
    if (!leaderboard.length) return null
    
    const totalModels = leaderboard.length
    const totalPredictions = leaderboard.reduce((sum, model) => 
      sum + model.totalPredictions, 0)
    const averageAccuracy = totalModels > 0 
      ? leaderboard.reduce((sum, model) => 
          sum + model.accuracyRate, 0) / totalModels
      : 0
    const resolvedMarkets = leaderboard.reduce((sum, model) => 
      sum + model.resolvedPredictions, 0)
    
    return {
      totalModels,
      totalPredictions,
      averageAccuracy,
      resolvedMarkets
    }
  }, [leaderboard])

  const handleTagChange = (tagLabel: string | null) => {
    setSelectedTag(tagLabel)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <LoadingCard />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Leaderboard</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <Trophy className="text-primary" />
              AI Model Leaderboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-6">
              Live rankings based on prediction accuracy on resolved markets. Track which AI models 
              are making the most accurate predictions across different categories.
            </p>
            
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-primary mb-2">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-medium">Models</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.totalModels}</div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-primary mb-2">
                    <Activity className="h-5 w-5" />
                    <span className="text-sm font-medium">Predictions</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.totalPredictions.toLocaleString()}</div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-primary mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Avg Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold">{(stats.averageAccuracy * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-primary mb-2">
                    <Trophy className="h-5 w-5" />
                    <span className="text-sm font-medium">Resolved</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.resolvedMarkets}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tag Filter */}
          <div className="flex justify-center">
            <TagFilter selectedTag={selectedTag} onTagChange={handleTagChange} />
          </div>

          {/* Filter Badge */}
          {selectedTag && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-sm">
                Filtered by: {selectedTag}
                <button
                  onClick={() => setSelectedTag(null)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            </div>
          )}

          {/* Leaderboard Table */}
          <LeaderboardTable data={leaderboard} />

          {/* Footer Note */}
          <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              Rankings are based on predictions made on markets that have since resolved. 
              Accuracy is calculated as the percentage of times an AI model assigned ≥50% 
              probability to the outcome that actually occurred.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}