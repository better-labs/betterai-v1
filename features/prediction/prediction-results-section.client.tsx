'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { trpc } from '@/lib/trpc/client'
import { AI_MODELS } from '@/lib/config/ai-models'
import { PredictionPollingErrorBoundary } from './PredictionPollingErrorBoundary.client'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { PredictionResultCard } from './prediction-result-card.client'
import { MarketCTA } from '@/features/market/market-card-sections'

interface PredictionResultsProps {
  sessionId: string
  marketId: string
  marketDTO?: any // MarketDTO
  eventDTO?: any // EventDTO  
  externalMarketUrl?: string | null
}

const STATUS_CONFIG = {
  INITIALIZING: {
    label: 'Initializing',
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  QUEUED: {
    label: 'Queued',
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
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

export function PredictionResults({ sessionId, marketId, marketDTO, eventDTO, externalMarketUrl }: PredictionResultsProps) {
  const router = useRouter()
  const [pollingInterval, setPollingInterval] = useState(5000) // Start with 5s

  // Poll session status - but only when authenticated
  const { ready, authenticated } = usePrivy()
  const { data: session, isLoading, error, refetch } = trpc.predictionSessions.status.useQuery(
    { sessionId },
    {
      enabled: ready && authenticated, // Only run when Privy is ready and user is authenticated
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
  const isActive = session.status === 'QUEUED' || session.status === 'RESEARCHING' || session.status === 'GENERATING'

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
                
                {/* Caption for active states */}
                {session.status === 'RESEARCHING' && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Researching and gathering the latest news and information to power your prediction.
                  </div>
                )}
                {(session.status === 'QUEUED' || session.status === 'GENERATING') && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Generating your predictions now. The process sually takes 15-30 seconds.
                  </div>
                )}
              </div>
              
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
              <PredictionResultCard
                key={modelId}
                model={model}
                prediction={prediction}
                sessionStatus={session.status}
                sessionStep={session.step}
                modelIndex={index}
                totalModels={session.selectedModels.length}
                marketData={marketDTO}
              />
            )
          })}
        </div>

        {/* Completion Actions */}
        {marketDTO && (
          <MarketCTA
            market={marketDTO}
            event={eventDTO}
            externalMarketUrl={externalMarketUrl}
            onGeneratePrediction={() => router.push(`/prediction-builder/${marketId}`)}
            
          />
        )}
        
      </div>
    </PredictionPollingErrorBoundary>
  )
}
