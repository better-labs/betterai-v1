'use client'

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import { useUser } from "@/hooks/use-user"
import { useQuery } from "@tanstack/react-query"
import { CreditBalance } from "@/lib/services/credit-manager"
import { CreditCard, Calendar, TrendingUp, AlertTriangle, Brain, DollarSign, ArrowLeft, User, Activity } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { usePrivy } from "@privy-io/react-auth"
import { authenticatedFetch } from "@/lib/utils"
import dynamic from "next/dynamic"
import Link from "next/link"
import { components } from "@/lib/design-system"

// Dynamic import of PrivyUserPill
const PrivyUserPill = dynamic(
  () => import("@privy-io/react-auth/ui").then((m) => m.UserPill),
  { 
    ssr: false,
    loading: () => <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
  }
)

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

export default function AccountPage() {
  const { user, isAuthenticated, isReady } = useUser()
  const { getAccessToken } = usePrivy()

  // Fetch user credits
  const { data: creditsData, isLoading } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async (): Promise<{ credits: CreditBalance | null; isAuthenticated: boolean; message?: string }> => {
      if (!isAuthenticated) {
        return {
          credits: null,
          isAuthenticated: false,
          message: 'User not authenticated'
        }
      }

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }

      const getToken = () => Promise.resolve(accessToken)
      const response = await authenticatedFetch('/api/user/credits', { method: 'GET' }, getToken)
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits')
      }
      return response.json()
    },
    enabled: isReady,
    refetchInterval: isAuthenticated ? 30000 : false,
  })

  const credits = creditsData?.credits

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
    <section className={components.page.section}>
      {/* Header with Back Button */}
      

      {/* User Profile Section with UserPill */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReady && isAuthenticated ? (
            <div className="flex items-center gap-4">
              <PrivyUserPill />
              <div className="text-sm text-muted-foreground">
                Manage your account settings and authentication
              </div>
            </div>
          ) : isReady ? (
            <div className="text-center py-8">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-6">
                Please log in to access your account information.
              </p>
              <Button>Sign In</Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading profile...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits Section */}
      <section className="mb-12">
        

        {/* Current Credits Balance */}
        {isAuthenticated ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credits Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Loading credits...</div>
                </div>
              ) : credits ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{credits.credits}</div>
                      <div className="text-sm text-muted-foreground">Available Credits</div>
                    </div>
                    <div className="text-right">
                      {credits.credits < 10 && (
                        <Badge variant="destructive" className="mb-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Credits
                        </Badge>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Next reset: {formatDistanceToNow(new Date(new Date(credits.creditsLastReset).getTime() + 7 * 24 * 60 * 60 * 1000), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-semibold">{credits.totalCreditsEarned}</div>
                        <div className="text-xs text-muted-foreground">Total Earned</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-semibold">{credits.totalCreditsSpent}</div>
                        <div className="text-xs text-muted-foreground">Total Spent</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Unable to load credit balance
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Credit Information - Only show when authenticated */}
        {isAuthenticated && (
          <>
            

            {/* Add Credits Section */}
            {credits && credits.credits < 10 && (
              <Card className="border-orange-200 bg-orange-50/50 mb-12">
                <CardHeader>
                  <CardTitle className="text-orange-800">Low Credit Warning</CardTitle>
                  <CardDescription className="text-orange-700">
                    You&apos;re running low on credits. Consider adding more credits to continue generating predictions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Add Credits (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>

      {/* Activity Section */}
      {isAuthenticated && (
        <section>

          {/* Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Prediction Activity
              </CardTitle>
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
        </section>
      )}
    </section>
  )
}