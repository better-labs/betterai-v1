'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { usePrivy } from '@privy-io/react-auth'
import { trpc } from '@/lib/trpc/client'
import { AI_MODELS } from '@/lib/config/ai-models'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Loader2, AlertCircle, Coins } from 'lucide-react'
import { components } from '@/lib/design-system'

interface PredictionGeneratorProps {
  marketId: string
}

export function PredictionGenerator({ marketId }: PredictionGeneratorProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, isReady } = useUser()
  const { login } = usePrivy() // Keep login function from usePrivy

  // Get user credits - using robust enabled condition
  const { data: userCreditsResponse, isLoading: creditsLoading } = trpc.users.getCredits.useQuery(
    {},
    { enabled: isReady && isAuthenticated && !!user?.id }
  )

  const userCredits = userCreditsResponse?.credits

  // Check for recent sessions - using robust enabled condition
  const { data: recentSessions } = trpc.predictionSessions.recentByMarket.useQuery(
    { marketId },
    { enabled: isReady && isAuthenticated && !!user?.id }
  )

  // Start prediction session mutation with Inngest
  const startSession = trpc.predictionSessions.start.useMutation({
    onSuccess: ({ sessionId }) => {
      router.push(`/predict/${marketId}/${sessionId}`)
    },
    onError: (error) => {
      console.error('Failed to start prediction session:', error)
      setIsGenerating(false)
    }
  })

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const handleSelectAll = () => {
    if (selectedModels.length === AI_MODELS.length) {
      // Deselect all
      setSelectedModels([])
    } else {
      // Select all
      setSelectedModels(AI_MODELS.map(model => model.id))
    }
  }

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      login()
      return
    }

    setIsGenerating(true)
    await startSession.mutateAsync({
      marketId,
      selectedModels,
      useInngest: true
    })
  }

  const totalCost = selectedModels.reduce((cost, modelId) => {
    const model = AI_MODELS.find(m => m.id === modelId)
    return cost + (model?.creditCost || 0)
  }, 0)

  const canGenerate = isReady && isAuthenticated && 
    selectedModels.length > 0 && 
    userCredits && 
    userCredits.credits >= totalCost

  const hasRecentSession = recentSessions && recentSessions.length > 0

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      {isAuthenticated && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Available Credits:</span>
                <Badge variant="secondary">
                  {creditsLoading ? '...' : userCredits?.credits || 0}
                </Badge>
              </div>
              {hasRecentSession && (
                <Button 
                  variant={components.toggleAction.variant}
                  size={components.toggleAction.sizePrimary}
                  className={components.toggleAction.buttonPrimary}
                  onClick={() => router.push(`/predict/${marketId}/${recentSessions[0].id}`)}
                >
                  View Last Run
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose AI Models</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose 1-5 AI models to generate predictions. Each model costs 1 credit.
          </p>
          
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile-first: Stack vertically, large touch targets */}
          <Button
            variant={components.toggleAction.variant}
            size={components.toggleAction.sizeSecondary}
            onClick={handleSelectAll}
            className={components.toggleAction.buttonSecondary}
            data-debug-id="select-all-models-button"
          >
            {selectedModels.length === AI_MODELS.length ? 'Deselect All' : 'Select All'}
          </Button>
          <div className="space-y-3">
            {AI_MODELS.map((model) => (
              <label
                key={model.id}
                className="flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                data-debug-id={`model-option-${model.id}`}
              >
                <Checkbox
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={() => handleModelToggle(model.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.provider}</div>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {model.creditCost} credit{model.creditCost !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {model.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Cost Summary */}
          {selectedModels.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Total Cost:</span>
                <span className="font-medium">{totalCost} credit{totalCost !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Error States */}
          {!isAuthenticated && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to generate predictions.
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && userCredits && userCredits.credits < totalCost && selectedModels.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient credits. You have {userCredits.credits} credits but need {totalCost}.
              </AlertDescription>
            </Alert>
          )}

          {startSession.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {startSession.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <div>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-12 text-base font-medium"
              data-debug-id="generate-prediction-button"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Prediction...
                </div>
              ) : (
                `Generate Prediction${selectedModels.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}