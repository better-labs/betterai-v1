'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { AI_MODELS } from '@/lib/config/ai-models'
import { PredictionPollingErrorBoundary } from './PredictionPollingErrorBoundary.client'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,

} from 'lucide-react'

import type { PredictionSessionStatus } from '@/lib/generated/prisma'
import { OutcomeStat } from '@/shared/ui/outcome-stat'

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
  const [pollingInterval, setPollingInterval] = useState(5000) // Start with 5s

  // Poll session status
  const { data: session, isLoading, error, refetch } = trpc.predictionSessions.status.useQuery(
    { sessionId },
    {
      refetchInterval: (query) => {
        // Stop polling when finished or error (but allow auth retry)
        const data = query.state.data
        const hasAuthError = query.state.error?.data?.code === 'UNAUTHORIZED'
        if (data && (data.status === 'FINISHED' || data.status === 'ERROR') && !hasAuthError) {
          return false
        }
        return pollingInterval
      },
      refetchIntervalInBackground: false,
      // More aggressive retry for auth errors
      retry: (failureCount, error: any) => {
        if (error?.data?.code === 'UNAUTHORIZED') {
          return failureCount < 2 // Try twice for auth errors
        }
        return failureCount < 1 // Less retry for other errors during polling
      },
      retryDelay: 1500, // Slightly longer delay for this specific query
    }
  )

  // Adjust polling frequency based on status
  useEffect(() => {
    if (session?.status === 'GENERATING') {
      setPollingInterval(5000) // Fast during generation
    } else if (session?.status === 'INITIALIZING' || session?.status === 'RESEARCHING') {
      setPollingInterval(8000) // Moderate during setup
    }
  }, [session?.status])

  if (error) {
    const isAuthError = error.data?.code === 'UNAUTHORIZED'
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isAuthError ? (
            <>
              Authentication expired. Please refresh the page to sign in again.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2 ml-2"
              >
                Refresh Page
              </Button>
            </>
          ) : (
            'Failed to load prediction session. Please try refreshing the page.'
          )}
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
      
        {/* Global Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1" aria-live="polite">
                <div className="flex items-center space-x-3 mb-2">
                  <StatusIcon 
                    className={`h-5 w-5 ${statusConfig.color} ${isActive ? 'animate-spin' : ''}`}
                    aria-label={isActive ? "Loading" : undefined}
                  />
                  <span className="font-medium">{statusConfig.label}</span>
                  {session.status === 'GENERATING' && (
                    <span className="text-sm text-muted-foreground">
                      ({session.predictions.length}/{session.selectedModels.length} models completed)
                    </span>
                  )}
                </div>
                
                {/* Progress Bar for Generation */}
                {session.status === 'GENERATING' && (
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                      style={{ 
                        width: `${(session.predictions.length / session.selectedModels.length) * 100}%` 
                      }}
                    />
                  </div>
                )}
                
                {session.step && (
                  <div className="text-sm text-muted-foreground">
                    {session.step}
                  </div>
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
          {session.selectedModels.map((modelId, index) => {
            const model = AI_MODELS.find(m => m.id === modelId)
            const prediction = session.predictions.find(p => p.modelName === modelId)
            
            return (
              <ModelResultCard
                key={modelId}
                model={model}
                prediction={prediction}
                sessionStatus={session.status}
                sessionStep={session.step}
                modelIndex={index}
                totalModels={session.selectedModels.length}
              />
            )
          })}
        </div>

        {/* Completion Actions */}
        {session.status === 'FINISHED' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="secondary"
              size="md"
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

interface SessionPrediction {
  id?: string
  outcomes?: string[]
  outcomesProbabilities?: number[]
  predictionResult?: {
    outcomes: string[]
    probabilities: number[]
  }
  aiResponse?: string | null
}

interface ModelResultCardProps {
  model?: typeof AI_MODELS[0]
  prediction?: SessionPrediction
  sessionStatus: PredictionSessionStatus
  sessionStep?: string | null
  modelIndex: number
  totalModels: number
}

function ModelResultCard({ model, prediction, sessionStatus, sessionStep, modelIndex, totalModels }: ModelResultCardProps) {
  const getModelStatus = () => {
    if (prediction) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-600', label: 'Complete' }
    }
    
    if (sessionStatus === 'ERROR') {
      return { status: 'failed', icon: AlertCircle, color: 'text-red-600', label: 'Failed' }
    }
    
    // Parse current model from step if available
    const isCurrentModel = sessionStep && model?.id && sessionStep.includes(model.id)
    const currentModelMatch = sessionStep?.match(/Generating prediction (\d+)\/(\d+)/)
    const currentModelIndex = currentModelMatch ? parseInt(currentModelMatch[1]) - 1 : -1
    
    if (sessionStatus === 'GENERATING') {
      if (isCurrentModel || currentModelIndex === modelIndex) {
        return { status: 'processing', icon: Loader2, color: 'text-blue-600', label: 'Generating...' }
      } else if (currentModelIndex > modelIndex) {
        // This model was processed but we don't have prediction yet (shouldn't happen)
        return { status: 'processing', icon: Loader2, color: 'text-blue-600', label: 'Processing...' }
      } else {
        // Model is queued
        return { status: 'waiting', icon: Clock, color: 'text-muted-foreground', label: 'Queued' }
      }
    }
    
    if (sessionStatus === 'RESEARCHING' || sessionStatus === 'INITIALIZING') {
      return { status: 'waiting', icon: Clock, color: 'text-muted-foreground', label: 'Waiting...' }
    }
    
    return { status: 'waiting', icon: Clock, color: 'text-muted-foreground', label: 'Waiting' }
  }

  const { status, icon: StatusIcon, color, label } = getModelStatus()

  return (
    <Card data-debug-id={`model-result-${model?.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{model?.name || 'Unknown Model'}</CardTitle>
            <p className="text-sm text-muted-foreground">{model?.provider}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon 
              className={`h-5 w-5 ${color} ${status === 'processing' ? 'animate-spin' : ''}`}
              aria-label={status === 'processing' ? "Loading" : undefined}
            />
            <span className={`text-sm font-medium ${color}`}>
              {label}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {status === 'waiting' && (
          <div className="text-sm text-muted-foreground">
            {sessionStatus === 'INITIALIZING' ? 'Initializing session...' : 
             sessionStatus === 'RESEARCHING' ? 'Researching market...' : 
             'Waiting in queue...'}
          </div>
        )}
        
        {status === 'processing' && (
          <div className="text-sm text-muted-foreground">
            Generating AI prediction...
          </div>
        )}
        
        {status === 'failed' && (
          <div className="text-sm text-red-600">Generation failed</div>
        )}
        
        {status === 'completed' && prediction && (
          <div className="space-y-3">
            {/* Prediction outcomes */}
            {prediction.outcomes && prediction.outcomesProbabilities && (
              <OutcomeStat
                label="Predicted Probabilities"
                outcomes={prediction.outcomes}
                values={prediction.outcomesProbabilities}
                className="space-y-2"
              />
            )}
            
            {/* View Prediction Details Button */}
            {prediction.id && (
              <div className="pt-2">
                <Link 
                  href={`/prediction/${prediction.id}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full"
                >
                  
                  View Details
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}