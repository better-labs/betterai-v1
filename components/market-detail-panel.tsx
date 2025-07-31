"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Brain, Zap, Database } from "lucide-react"
import { Market, PredictionResult } from "@/lib/types"

interface MarketDetailPanelProps {
  market: Market
  selectedModel: string
  onModelChange: (modelId: string) => void
  selectedDataSources: string[]
  onDataSourceChange: (sourceId: string, checked: boolean) => void
  onPredict: () => void
  isLoading: boolean
  prediction: PredictionResult | null
}

const aiModels = [
  { id: "gpt-3.5", name: "GPT-3.5", cost: 0, quality: "Free", description: "Free tier model" },
  { id: "gpt-4o", name: "GPT-4o", cost: 5, quality: "Premium", description: "Latest OpenAI model" },
  { id: "claude-3", name: "Claude 3", cost: 4, quality: "Premium", description: "Anthropic's advanced model" },
]

const dataSources = [
  { id: "news", name: "News Articles", description: "Latest financial and crypto news" },
  { id: "twitter", name: "Twitter/X", description: "Social sentiment analysis" },
  { id: "onchain", name: "On-chain Data", description: "Blockchain metrics and analytics" },
  { id: "technical", name: "Technical Analysis", description: "Price charts and indicators" },
]

export function MarketDetailPanel({
  market,
  selectedModel,
  onModelChange,
  selectedDataSources,
  onDataSourceChange,
  onPredict,
  isLoading,
  prediction,
}: MarketDetailPanelProps) {
  return (
    <div className="border-t bg-muted/50 p-6">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-2">Market Detail</h4>
          <p className="text-foreground text-sm leading-relaxed">{market.description}</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>BetterAI Prediction Engine</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Choose AI Model</h3>
              <RadioGroup value={selectedModel} onValueChange={onModelChange}>
                {aiModels.map((model) => (
                  <div key={model.id} className="flex items-center space-x-3 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <RadioGroupItem value={model.id} id={`${market.id}-${model.id}`} />
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
                          <div className="text-xs text-muted-foreground mt-1">{model.quality}</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 text-foreground">Enrich with Data Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Checkbox
                      id={`${market.id}-${source.id}`}
                      checked={selectedDataSources.includes(source.id)}
                      onCheckedChange={(checked) => onDataSourceChange(source.id, checked as boolean)}
                    />
                    <Label htmlFor={`${market.id}-${source.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-muted-foreground">{source.description}</div>
                    </Label>
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                ))}
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
          <Card className="border-primary mt-6 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Brain className="h-5 w-5" />
                <span>AI Prediction Result</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {prediction.confidence}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {prediction.recommendedOutcome}
                  </div>
                  <div className="text-sm text-muted-foreground">Recommended</div>
                </div>
                <div className="text-center">
                  <Badge
                    variant={
                      prediction.riskLevel === "Low"
                        ? "secondary"
                        : prediction.riskLevel === "Medium"
                          ? "default"
                          : "destructive"
                    }
                    className="shadow-sm"
                  >
                    {prediction.riskLevel} Risk
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
                </div>
              </div>

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