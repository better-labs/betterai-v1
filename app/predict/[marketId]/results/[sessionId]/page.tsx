'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Zap, Share2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { LoadingCard } from '@/components/ui/loading'
import type { PredictionResult, ApiResponse } from '@/lib/types'
import type { MarketOutput as MarketDTO, EventOutput as EventDTO } from '@/lib/trpc/schemas'
// Move SUPPORTED_MODELS to avoid Prisma client import on client-side
const SUPPORTED_MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Google Gemini', description: 'Advanced reasoning', costCredits: 1 },
  { id: 'openai/gpt-5', name: 'OpenAI GPT-5', description: 'Latest OpenAI model', costCredits: 1 },
  { id: 'anthropic/claude-sonnet-4', name: 'Anthropic Claude', description: 'Thoughtful analysis', costCredits: 1 },
  { id: 'x-ai/grok-4', name: 'xAI Grok', description: 'Real-time aware', costCredits: 1 },
  { id: 'qwen3-235b-a22b-instruct-2507', name: 'Alibaba Qwen', description: 'Multilingual capability', costCredits: 1 }
]

interface PredictionResultsPageProps {
  params: Promise<{
    marketId: string
    sessionId: string
  }>
}

interface MarketData {
  market: MarketDTO
  event?: EventDTO
}

interface ProgressUpdate {
  type: 'connected' | 'progress' | 'complete' | 'error'
  sessionId: string
  status?: 'initializing' | 'researching' | 'predicting' | 'completed' | 'error'
  progress?: number
  currentStep?: string
  completedModels?: string[]
  totalModels?: number
  results?: { [modelId: string]: PredictionResult }
  error?: string
  timestamp?: string
}

export default function PredictionResultsPage({ params }: PredictionResultsPageProps) {
  const router = useRouter()
  const { user, authenticated } = usePrivy()
  const [marketId, setMarketId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Progress tracking
  const [status, setStatus] = useState<string>('initializing')
  const [progress, setProgress] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [completedModels, setCompletedModels] = useState<string[]>([])
  const [totalModels, setTotalModels] = useState<number>(0)
  const [results, setResults] = useState<{ [modelId: string]: PredictionResult }>({})
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(({ marketId, sessionId }) => {
      setMarketId(marketId)
      setSessionId(sessionId)
    })
  }, [params])

  // Fetch market data
  useEffect(() => {
    if (!marketId) return

    const fetchMarketData = async () => {
      try {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
  }, [marketId])

  // Set up SSE connection for progress tracking
  useEffect(() => {
    if (!sessionId || !authenticated) return

    const es = new EventSource(`/api/predict/stream/${sessionId}`)
    setEventSource(es)

    es.onmessage = (event) => {
      try {
        const data: ProgressUpdate = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            console.log('Connected to prediction stream')
            break
          
          case 'progress':
            if (data.status) setStatus(data.status)
            if (data.progress !== undefined) setProgress(data.progress)
            if (data.currentStep) setCurrentStep(data.currentStep)
            if (data.completedModels) setCompletedModels(data.completedModels)
            if (data.totalModels) setTotalModels(data.totalModels)
            if (data.results) setResults(data.results)
            break
          
          case 'complete':
            setIsComplete(true)
            if (data.status) setStatus(data.status)
            if (data.results) setResults(data.results)
            setProgress(100)
            es.close()
            break
          
          case 'error':
            setError(data.error || 'An error occurred during prediction')
            setIsComplete(true)
            es.close()
            break
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err)
      }
    }

    es.onerror = (err) => {
      console.error('SSE connection error:', err)
      setError('Connection lost. Please refresh the page.')
      es.close()
    }

    // Cleanup on unmount
    return () => {
      es.close()
    }
  }, [sessionId, authenticated])

  // Authentication check
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to view prediction results.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LoadingCard message="Loading prediction results..." />
        </div>
      </div>
    )
  }

  // Error state (market not found)
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

  if (!marketData) return null

  const getModelName = (modelId: string) => {
    const model = SUPPORTED_MODELS.find(m => m.id === modelId)
    return model ? model.name : modelId
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initializing':
        return 'Initializing'
      case 'researching':
        return 'Researching'
      case 'predicting':
        return 'Generating Predictions'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Processing'
    }
  }

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Predictions for ${marketData.market.question}`,
          text: `Check out these AI predictions for: ${marketData.market.question}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const retryPrediction = () => {
    router.push(`/predict/${marketId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/predict/${marketId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prediction Builder
            </Button>
          </Link>
          
          {isComplete && (
            <div className="flex gap-2">
              <Button onClick={shareResults} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={retryPrediction} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Prediction
              </Button>
            </div>
          )}
        </div>

        {/* Market Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {marketData.market.question}
            </CardTitle>
            {marketData.event && (
              <CardDescription>{marketData.event.title}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Progress Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <CardTitle className="text-lg">
                  {getStatusText(status)}
                </CardTitle>
              </div>
              <Badge variant={isComplete ? "default" : "secondary"}>
                {completedModels.length} / {totalModels} models
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              {currentStep && (
                <p className="text-sm text-muted-foreground">{currentStep}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Prediction Results */}
        {Object.entries(results).map(([modelId, result]) => (
          <Card key={modelId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {getModelName(modelId)}
                </CardTitle>
                <Badge variant={result.confidence_level === 'High' ? 'default' : result.confidence_level === 'Medium' ? 'secondary' : 'outline'}>
                  {result.confidence_level} Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Prediction</h4>
                <p className="text-lg">{result.prediction}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Outcome Probabilities</h4>
                <div className="space-y-2">
                  {result.outcomes.map((outcome, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{outcome}</span>
                      <Badge variant="outline">
                        {(result.outcomesProbabilities[index] * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Reasoning</h4>
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Loading state for individual models */}
        {!isComplete && Object.keys(results).length < totalModels && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Generating predictions from remaining AI models...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}