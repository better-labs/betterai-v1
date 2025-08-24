"use client"

import { useState, useEffect } from "react"
import { LeaderboardTable } from "@/components/client/leaderboard-table"
import { TagFilter } from "@/components/client/tag-filter"
import { LoadingCard } from "@/components/ui/loading"
import { TrendingUp, Trophy, Target, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = async (tagLabel?: string) => {
    try {
      setLoading(true)
      const url = tagLabel 
        ? `/api/leaderboard?tag=${encodeURIComponent(tagLabel)}`
        : '/api/leaderboard'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      
      const data = await response.json()
      const leaderboardData = data.data?.leaderboard || []
      setLeaderboard(leaderboardData)
      
      // Calculate stats from leaderboard data
      const totalModels = leaderboardData.length || 0
      const totalPredictions = leaderboardData.reduce((sum: number, model: LeaderboardEntry) => 
        sum + model.totalPredictions, 0) || 0
      const averageAccuracy = totalModels > 0 
        ? leaderboardData.reduce((sum: number, model: LeaderboardEntry) => 
            sum + model.accuracyRate, 0) / totalModels
        : 0
      const resolvedMarkets = leaderboardData.reduce((sum: number, model: LeaderboardEntry) => 
        sum + model.resolvedPredictions, 0) || 0
      
      setStats({
        totalModels,
        totalPredictions,
        averageAccuracy,
        resolvedMarkets
      })
      
      setError(null)
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard(selectedTag || undefined)
  }, [selectedTag])

  const handleTagChange = (tagLabel: string | null) => {
    setSelectedTag(tagLabel)
  }

  if (loading) {
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
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => fetchLeaderboard(selectedTag || undefined)}
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