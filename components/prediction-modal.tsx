"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, X } from "lucide-react"

interface PredictionResult {
  prediction: string
  confidence: number
  reasoning: string
  recommendedOutcome: string
  riskLevel: "Low" | "Medium" | "High"
  keyFactors?: string[]
  riskFactors?: string[]
}

interface PredictionModalProps {
  isOpen: boolean
  onClose: () => void
  market: {
    question: string
    category: string
  }
  isThinking: boolean
  thinkingMessage: string
  progress: number
  prediction: PredictionResult | null
}

export function PredictionModal({
  isOpen,
  onClose,
  market,
  isThinking,
  thinkingMessage,
  progress,
  prediction,
}: PredictionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-[#4B9CD3]" />
              <span>BetterAI Prediction</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {market.category}
              </Badge>
            </div>
            <h3 className="font-medium text-black">{market.question}</h3>
          </div>

          {/* Thinking State */}
          {isThinking && (
            <div className="space-y-4 p-6 text-center">
              <div className="flex justify-center">
                <Zap className="h-8 w-8 text-[#4B9CD3] animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">AI is thinking...</h3>
                <p className="text-gray-600 mb-4">{thinkingMessage}</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
              </div>
            </div>
          )}

          {/* Prediction Results */}
          {prediction && !isThinking && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#4B9CD3]/5 rounded-lg">
                  <div className="text-2xl font-bold text-[#4B9CD3]">{prediction.confidence}%</div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-black">{prediction.recommendedOutcome}</div>
                  <div className="text-sm text-gray-500">Recommended</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge
                    variant={
                      prediction.riskLevel === "Low"
                        ? "secondary"
                        : prediction.riskLevel === "Medium"
                          ? "default"
                          : "destructive"
                    }
                    className="mb-1"
                  >
                    {prediction.riskLevel} Risk
                  </Badge>
                  <div className="text-sm text-gray-500">Risk Level</div>
                </div>
              </div>

              <Separator />

              {/* Analysis */}
              <div>
                <h4 className="font-semibold mb-3 text-black flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-[#4B9CD3]" />
                  AI Analysis
                </h4>
                <p className="text-gray-700 leading-relaxed">{prediction.prediction}</p>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-semibold mb-3 text-black">Reasoning</h4>
                <p className="text-gray-700 leading-relaxed">{prediction.reasoning}</p>
              </div>

              {/* Key Factors */}
              {prediction.keyFactors && (
                <div>
                  <h4 className="font-semibold mb-3 text-black flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Supporting Factors
                  </h4>
                  <ul className="space-y-2">
                    {prediction.keyFactors.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors */}
              {prediction.riskFactors && (
                <div>
                  <h4 className="font-semibold mb-3 text-black flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-2">
                    {prediction.riskFactors.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  className="flex-1 bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white"
                  onClick={() => {
                    // TODO: Implement save prediction
                    console.log("Save prediction")
                  }}
                >
                  Save Prediction
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
