'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ModelProvider } from '@/lib/types'
import { SUPPORTED_MODELS, calculateTotalCredits } from '@/lib/services/generate-user-prediction'

interface ModelProviderSelectionProps {
  selectedModels: string[]
  onSelectionChange: (selectedModels: string[]) => void
  availableCredits?: number
  onGenerate: () => void
  isGenerating?: boolean
}

export function ModelProviderSelection({
  selectedModels,
  onSelectionChange,
  availableCredits = 0,
  onGenerate,
  isGenerating = false
}: ModelProviderSelectionProps) {
  const totalCredits = calculateTotalCredits(selectedModels)
  const hasInsufficientCredits = totalCredits > availableCredits
  const hasNoSelection = selectedModels.length === 0

  const handleModelToggle = (modelId: string) => {
    const newSelection = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId]
    
    onSelectionChange(newSelection)
  }

  const isModelSelected = (modelId: string) => selectedModels.includes(modelId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select AI Models</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose one or more AI models to generate predictions. Each model provides a unique perspective.
        </p>
      </div>

      <div className="grid gap-4">
        {SUPPORTED_MODELS.map((model) => (
          <Card 
            key={model.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isModelSelected(model.id) 
                ? 'ring-2 ring-primary border-primary' 
                : 'border-border'
            }`}
            onClick={() => handleModelToggle(model.id)}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <Checkbox
                id={model.id}
                checked={isModelSelected(model.id)}
                onChange={() => handleModelToggle(model.id)}
                className="pointer-events-none"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {model.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      {model.costCredits} credit{model.costCredits !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Cost Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Cost</p>
              <p className="text-xs text-muted-foreground">
                {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {totalCredits} credit{totalCredits !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Available: {availableCredits}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Errors */}
      {hasInsufficientCredits && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Insufficient credits. You need {totalCredits} credits but only have {availableCredits} available.
          </AlertDescription>
        </Alert>
      )}

      {hasNoSelection && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select at least one AI model to generate predictions.
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={hasNoSelection || hasInsufficientCredits || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Predictions...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Generate Predictions ({totalCredits} credit{totalCredits !== 1 ? 's' : ''})
          </>
        )}
      </Button>
    </div>
  )
}