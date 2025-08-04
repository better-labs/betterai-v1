"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, X } from "lucide-react"
import { PredictionResult } from "@/lib/types"

interface PredictionModalProps {
  isOpen: boolean
  onClose: () => void
  market: {
    question: string
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
              <Brain className="h-5 w-5 text-primary" />
              <span>BetterAI Prediction</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-foreground">{market.question}</h3>
          </div>

          {/* Thinking State */}
          {isThinking && (
            <div className="space-y-4 p-6 text-center">
              <div className="flex justify-center">
                <Zap className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI is thinking...</h3>
                <p className="text-muted-foreground mb-4">{thinkingMessage}</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
              </div>
            </div>
          )}

          {/* Prediction Results */}
          {prediction && !isThinking && (
            <div className="space-y-6">


              <Separator />

              {/* Analysis */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                  AI Analysis
                </h4>
                <p className="text-foreground leading-relaxed">{prediction.prediction}</p>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Reasoning</h4>
                <p className="text-foreground leading-relaxed">{prediction.reasoning}</p>
              </div>





              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement save prediction
                    console.log("Save prediction")
                  }}
                >
                  Save Prediction
                </Button>
                <Button variant="outline" className="flex-1" onClick={onClose}>
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
