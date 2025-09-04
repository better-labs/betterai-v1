'use client'

import Link from 'next/link'
import { AI_MODELS } from '@/lib/config/ai-models'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react'

import type { PredictionSessionStatus } from '@/lib/generated/prisma'
import { StatsDisplaySection } from '@/shared/ui/stats-display-section.client'
import { AIDelta } from '@/features/market/market-card-sections'
import type { MarketDTO, PredictionDTO } from '@/lib/types'

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

interface PredictionResultCardProps {
  model?: typeof AI_MODELS[0]
  prediction?: SessionPrediction
  sessionStatus: PredictionSessionStatus
  sessionStep?: string | null
  modelIndex: number
  totalModels: number
  marketData?: MarketDTO | null
}

export function PredictionResultCard({ model, prediction, sessionStatus, sessionStep, modelIndex, marketData }: PredictionResultCardProps) {
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
              <StatsDisplaySection
                title="Predicted Probabilities"
                stats={prediction.outcomes.map((outcome, index) => ({
                  label: outcome,
                  value: prediction.outcomesProbabilities?.[index] || null
                }))}
                className="space-y-2"
              />
            )}
            
            {/* AI Delta */}
            {prediction.id && marketData && prediction.outcomesProbabilities && (
              <div className="pt-2">
                <AIDelta
                  market={marketData}
                  latestPrediction={{
                    id: prediction.id,
                    outcomesProbabilities: prediction.outcomesProbabilities
                  } as PredictionDTO}
                  hideReasoning={true}
                />
              </div>
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