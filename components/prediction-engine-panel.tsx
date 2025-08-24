"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import { Brain, Zap, Database } from "lucide-react"
import { Market, PredictionResult } from "@/lib/types"

interface PredictionEnginePanelProps {
  market: Market
  selectedModels: string[]
  onModelChange: (modelId: string, checked: boolean) => void
  selectedDataSources: string[]
  onDataSourceChange: (sourceId: string, checked: boolean) => void
  onPredict: () => void
  isLoading: boolean
  prediction: PredictionResult | null
}

const aiModels = [
  { id: "grok-4", name: "Grok 4.0", cost: 3, quality: "Premium", description: "Latest xAI model" },
  { id: "gpt-4o", name: "GPT-4o", cost: 5, quality: "Premium", description: "Latest OpenAI model" },
  { id: "claude-3", name: "Claude 3", cost: 4, quality: "Premium", description: "Anthropic's advanced model" },
]

const dataSources = [
  { id: "twitter", name: "X (Twitter)", description: "Social sentiment analysis", cost: 10 },
  { id: "news", name: "News Articles", description: "Latest financial and crypto news", cost: 1 },
  { id: "onchain", name: "On-chain Data", description: "Blockchain metrics and analytics", cost: 3 },

]

export function PredictionEnginePanel({
  market,
  selectedModels,
  onModelChange,
  selectedDataSources,
  onDataSourceChange,
  onPredict,
  isLoading,
  prediction,
}: PredictionEnginePanelProps) {
  return (
    <div className="border-t bg-muted/50 p-6 rounded-b-lg">
      <div className="max-w-4xl mx-auto">
        

        <Card className="shadow-sm max-w-3xl mx-auto">
          <CardHeader className="relative">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Prediction Engine</span>
            </CardTitle>
            <Button
              onClick={onPredict}
              disabled={isLoading}
              size="sm"
              data-testid="launch-prediction-button"
              className="absolute top-4 right-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {isLoading ? (
                <>
                  <Zap className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-3 w-3 mr-1" />
                  Launch AI Prediction
                </>
              )}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="relative">
              <h3 className="font-semibold mb-3 text-foreground">Choose AI Models</h3>
              <div className="space-y-3">
                {aiModels.map((model) => (
                  <div key={model.id} className="flex items-center space-x-3 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Checkbox
                      id={`${market.id}-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) => onModelChange(model.id, checked as boolean)}
                    />
                    <Label htmlFor={`${market.id}-${model.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">{model.description}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={model.cost === 0 ? "secondary" : "default"} className="shadow-sm">
                            {model.cost === 0 ? "Free" : `${model.cost} credits`}
                          </Badge>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground mb-1">Coming Soon</div>
                  <div className="text-sm text-muted-foreground">AI model selection will be available soon</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="relative">
              <h3 className="font-semibold mb-3 text-foreground">Enrich with Data Sources</h3>
              <div className="space-y-3">
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Checkbox
                      id={`${market.id}-${source.id}`}
                      checked={selectedDataSources.includes(source.id)}
                      onCheckedChange={(checked) => onDataSourceChange(source.id, checked as boolean)}
                    />
                    <Label htmlFor={`${market.id}-${source.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">{source.description}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="shadow-sm">
                            {source.cost} credit{source.cost !== 1 ? 's' : ''}
                          </Badge>
                          
                        </div>
                      </div>
                    </Label>
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
              
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground mb-1">Coming Soon</div>
                  <div className="text-sm text-muted-foreground">Data source enrichment will be available soon</div>
                </div>
              </div>
            </div>

            <Button
              onClick={onPredict}
              disabled={isLoading}
              className="w-full shadow-sm hover:shadow-md transition-shadow"
            >
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Generating Prediction...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Launch AI Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        {prediction && (
          <Card className="border-primary mt-6 shadow-sm max-w-3xl mx-auto" data-testid="prediction-result-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2 text-primary">
                <Brain className="h-5 w-5" />
                <span>AI Prediction Result</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4" data-testid="prediction-result-content">


              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Analysis</h4>
                <p className="text-foreground leading-relaxed">{prediction.prediction}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Reasoning</h4>
                <p className="text-foreground leading-relaxed">{prediction.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 