"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui/card"
import { Badge } from "@/src/shared/ui/badge"
import { Button } from "@/src/shared/ui/button"
import { ArrowLeft, Brain, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"

interface PredictionActivity {
  id: string
  market: string
  prediction: string
  confidence: number
  cost: number
  date: string
  status: "completed" | "processing" | "failed"
}

const mockActivity: PredictionActivity[] = [
  {
    id: "1",
    market: "Will the Libertarian party win the popular vote?",
    prediction: "No - Libertarian party unlikely to win popular vote",
    confidence: 78,
    cost: 5.00,
    date: "2024-01-15",
    status: "completed"
  },
  {
    id: "2", 
    market: "Will Bitcoin reach $100,000 by end of 2024?",
    prediction: "Yes - Bitcoin likely to reach $100k based on market trends",
    confidence: 65,
    cost: 4.00,
    date: "2024-01-14",
    status: "completed"
  },
  {
    id: "3",
    market: "Who will win the 2024 NBA Finals?",
    prediction: "Celtics - Strong team performance indicators",
    confidence: 82,
    cost: 5.00,
    date: "2024-01-13",
    status: "completed"
  },
  {
    id: "4",
    market: "Will the Democratic party win the popular vote?",
    prediction: "Yes - Democratic party favored in current polls",
    confidence: 71,
    cost: 4.00,
    date: "2024-01-12",
    status: "processing"
  },
  {
    id: "5",
    market: "Will Tesla stock reach $300 by Q2 2024?",
    prediction: "No - Market volatility suggests lower target",
    confidence: 58,
    cost: 3.00,
    date: "2024-01-11",
    status: "failed"
  }
]

export default function ActivityPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "failed":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const totalCost = mockActivity.reduce((sum, activity) => sum + activity.cost, 0)
  const completedPredictions = mockActivity.filter(activity => activity.status === "completed").length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activity</h1>
            <p className="text-muted-foreground">Your prediction history and costs</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedPredictions} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average ${(totalCost / mockActivity.length).toFixed(2)} per prediction
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completedPredictions / mockActivity.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {mockActivity.filter(a => a.status === "failed").length} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivity.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">{activity.market}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{activity.prediction}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Confidence: {activity.confidence}%</span>
                      <span>Cost: ${activity.cost.toFixed(2)}</span>
                      <span>{new Date(activity.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 