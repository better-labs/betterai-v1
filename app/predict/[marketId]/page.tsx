'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ModelProviderSelection } from '@/components/prediction-builder/model-provider-selection'
import MarketDetailsCard from '@/components/market-details-card'
import { MarketEventHeader } from '@/components/market-event-header'
import { LoadingCard } from '@/components/ui/loading'
import type { CreditBalanceClient, ApiResponse } from '@/lib/types'
import type { MarketOutput as MarketDTO, EventOutput as EventDTO } from '@/lib/trpc/schemas'

interface PredictionBuilderPageProps {
  params: Promise<{
    marketId: string
  }>
}

interface MarketData {
  market: MarketDTO
  event?: EventDTO
}

export default function PredictionBuilderPage({ params }: PredictionBuilderPageProps) {
  const router = useRouter()
  const { user, authenticated } = usePrivy()
  const [marketId, setMarketId] = useState<string>('')
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [creditBalance, setCreditBalance] = useState<CreditBalanceClient | null>(null)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(({ marketId }) => {
      setMarketId(marketId)
    })
  }, [params])

  // Fetch market data and credit balance
  useEffect(() => {
    if (!marketId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch market data
        const marketResponse = await fetch(`/api/markets/${marketId}`)
        if (!marketResponse.ok) {
          throw new Error('Market not found')
        }
        const marketResult: ApiResponse = await marketResponse.json()
        if (marketResult.success && marketResult.data) {
          setMarketData(marketResult.data as MarketData)
        } else {
          throw new Error(marketResult.error || 'Failed to load market data')
        }

        // Fetch credit balance if authenticated
        if (authenticated && user) {
          const creditResponse = await fetch('/api/user/credits')
          if (creditResponse.ok) {
            const creditData: ApiResponse<{ credits: CreditBalanceClient }> = await creditResponse.json()
            if (creditData.success && creditData.data?.credits) {
              setCreditBalance(creditData.data.credits)
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [marketId, authenticated, user])

  const handleGenerate = async () => {
    if (!authenticated || !user) {
      router.push('/login')
      return
    }

    if (selectedModels.length === 0) {
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/predict/multi-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
          selectedModels,
        }),
      })

      const result: ApiResponse = await response.json()

      if (result.success && result.data && (result.data as any).sessionId) {
        // Redirect to results page with session ID
        router.push(`/predict/${marketId}/results/${(result.data as any).sessionId}`)
      } else {
        setError(result.error || 'Failed to initiate prediction')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start prediction')
    } finally {
      setIsGenerating(false)
    }
  }

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LoadingCard message="Loading market data..." />
        </div>
      </div>
    )
  }

  // Show error if market not found
  if (error && !marketData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Link href="/markets">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication prompt if not logged in
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to generate predictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => router.push('/login')} className="w-full">
                  Sign In to Continue
                </Button>
                <Link href={`/market/${marketId}`}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    View Market Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!marketData) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/market/${marketId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Market
            </Button>
          </Link>
        </div>

        {/* Event Header */}
        {marketData.event && (
          <MarketEventHeader 
            eventId={marketData.event.id}
            eventTitle={marketData.event.title}
            eventImage={marketData.event.image}
            eventIcon={marketData.event.icon}
            marketId={marketData.market.id}
            marketQuestion={marketData.market.question}
          />
        )}

        {/* Market Details */}
        <MarketDetailsCard market={marketData.market} />

        {/* Prediction Builder */}
        <Card>
          <CardHeader>
            <CardTitle>AI Prediction Builder</CardTitle>
            <CardDescription>
              Generate AI-powered predictions using multiple models for enhanced accuracy and perspective.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <ModelProviderSelection
              selectedModels={selectedModels}
              onSelectionChange={setSelectedModels}
              availableCredits={creditBalance?.credits || 0}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}