'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { AI_MODELS } from '@/lib/config/ai-models'
import { PredictionPollingErrorBoundary } from './PredictionPollingErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { formatPercent } from '@/lib/utils'
import type { PredictionSessionStatus } from '@/lib/generated/prisma'

interface PredictionResultsProps {
  sessionId: string
  marketId: string
}

const STATUS_CONFIG = {
  INITIALIZING: {
    label: 'Initializing',
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  RESEARCHING: {
    label: 'Researching',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  GENERATING: {
    label: 'Generating',
    icon: Loader2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  FINISHED: {
    label: 'Complete',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  ERROR: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
} as const

export function PredictionResults({ sessionId, marketId }: PredictionResultsProps) {
  const router = useRouter()
  const [pollingInterval, setPollingInterval] = useState(10000) // Start with 10s

  // Poll session status
  const { data: session, isLoading, error, refetch } = trpc.predictionSessions.status.useQuery(
    { sessionId },
    {
      refetchInterval: (query) => {
        // Stop polling when finished or error
        const data = query.state.data
        if (data && (data.status === 'FINISHED' || data.status === 'ERROR')) {
          return false
        }
        return pollingInterval
      },
      refetchIntervalInBackground: false,
    }
  )

  // Adjust polling frequency based on status
  useEffect(() => {
    if (session?.status === 'GENERATING') {
      setPollingInterval(8000) // Faster during generation
    } else if (session?.status === 'INITIALIZING' || session?.status === 'RESEARCHING') {
      setPollingInterval(15000) // Slower during setup
    }
  }, [session?.status])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load prediction session. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !session) {
    return (
      <div className="space-y-4" aria-live="polite" aria-label="Loading prediction results">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading prediction results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[session.status]
  const StatusIcon = statusConfig.icon
  const isActive = session.status === 'RESEARCHING' || session.status === 'GENERATING'

  return (
    <PredictionPollingErrorBoundary>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/predict/${marketId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Generator
        </Button>

        {/* Global Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" aria-live="polite">
                <StatusIcon 
                  className={`h-5 w-5 ${statusConfig.color} ${isActive ? 'animate-spin' : ''}`}
                  aria-label={isActive ? "Loading" : undefined}
                />
                <span className="font-medium">{statusConfig.label}</span>
                {session.step && (
                  <span className="text-sm text-muted-foreground">• {session.step}</span>
                )}
              </div>
              
              {/* Manual refresh for debugging */}
              {session.status !== 'FINISHED' && session.status !== 'ERROR' && (
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {session.status === 'ERROR' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {session.error || 'An error occurred during prediction generation.'}
              {session.error?.includes('refund') && (
                <div className="mt-2 text-sm">
                  Your credits have been refunded.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Model Results - Mobile-first vertical stack */}
        <div className="space-y-4">
          {session.selectedModels.map((modelId) => {
            const model = AI_MODELS.find(m => m.id === modelId)
            const prediction = session.predictions.find(p => p.modelName === modelId)
            
            return (
              <ModelResultCard
                key={modelId}
                model={model}
                prediction={prediction}
                sessionStatus={session.status}
              />
            )
          })}
        </div>

        {/* Completion Actions */}
        {session.status === 'FINISHED' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => router.push(`/predict/${marketId}`)}
              className="flex-1"
            >
              Generate New Prediction
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/market/${marketId}`)}
              className="flex-1"
            >
              View Market Details
            </Button>
          </div>
        )}
      </div>
    </PredictionPollingErrorBoundary>
  )
}

interface ModelResultCardProps {
  model?: typeof AI_MODELS[0]
  prediction?: any
  sessionStatus: PredictionSessionStatus
}

function ModelResultCard({ model, prediction, sessionStatus }: ModelResultCardProps) {
  const getModelStatus = () => {
    if (prediction) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-600' }
    }
    
    if (sessionStatus === 'ERROR') {
      return { status: 'failed', icon: AlertCircle, color: 'text-red-600' }
    }
    
    if (sessionStatus === 'GENERATING' || sessionStatus === 'RESEARCHING') {
      return { status: 'processing', icon: Loader2, color: 'text-blue-600' }
    }
    
    return { status: 'waiting', icon: Clock, color: 'text-muted-foreground' }
  }

  const { status, icon: StatusIcon, color } = getModelStatus()

  return (
    <Card data-debug-id={`model-result-${model?.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{model?.name || 'Unknown Model'}</CardTitle>
            <p className="text-sm text-muted-foreground">{model?.provider}</p>
          </div>
          <StatusIcon 
            className={`h-5 w-5 ${color} ${status === 'processing' ? 'animate-spin' : ''}`}
            aria-label={status === 'processing' ? "Loading" : undefined}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {status === 'waiting' && (
          <div className="text-sm text-muted-foreground">Waiting...</div>
        )}
        
        {status === 'processing' && (
          <div className="text-sm text-muted-foreground">Processing...</div>
        )}
        
        {status === 'failed' && (
          <div className="text-sm text-red-600">Failed</div>
        )}
        
        {status === 'completed' && prediction && (
          <div className="space-y-3">
            {/* Prediction outcomes */}
            {prediction.predictionResult?.outcomes && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Predicted Probabilities:</h4>
                <div className="space-y-1">
                  {prediction.predictionResult.outcomes.map((outcome: string, index: number) => (
                    <div key={outcome} className="flex justify-between text-sm">
                      <span>{outcome}</span>
                      <Badge variant="outline">
                        {formatPercent(prediction.predictionResult.probabilities?.[index])}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI reasoning - collapsible on mobile */}
            {prediction.aiResponse && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                  View AI Analysis
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {prediction.aiResponse}
                </div>
              </details>
            )}
            
            {/* View Prediction Details Button */}
            {prediction.id && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/prediction/${prediction.id}`, '_blank')}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Prediction Details
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}