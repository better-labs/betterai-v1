'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, AlertCircle, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { checkCreditAffordability, formatCreditDisplay } from '@/lib/utils/credit-helpers'
import type { CreditBalanceClient, ApiResponse } from '@/lib/types'

interface PredictionActionButtonsProps {
  marketId: string
  hasExistingPrediction?: boolean
  className?: string
}

export function PredictionActionButtons({ 
  marketId, 
  hasExistingPrediction = false,
  className = ""
}: PredictionActionButtonsProps) {
  const { user, authenticated, login } = usePrivy()
  const [creditBalance, setCreditBalance] = useState<CreditBalanceClient | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch credit balance when authenticated
  useEffect(() => {
    if (authenticated && user) {
      fetchCreditBalance()
    }
  }, [authenticated, user])

  const fetchCreditBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const result: ApiResponse<{ credits: CreditBalanceClient }> = await response.json()
        if (result.success && result.data?.credits) {
          setCreditBalance(result.data.credits)
        }
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if user can afford a basic prediction (1 model = 1 credit)
  const basicPredictionCheck = checkCreditAffordability(creditBalance, 1)
  
  // Check if user can afford multi-model prediction (up to 5 credits)
  const multiModelCheck = checkCreditAffordability(creditBalance, 5)

  if (!authenticated) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-6 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            Sign in to generate AI predictions
          </p>
          <Button onClick={login} className="w-full">
            Sign In to Predict
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-6">
          <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Loading credit balance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Credit balance display */}
      {creditBalance && (
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <span className="text-sm text-muted-foreground">Available Credits</span>
          <Badge variant="secondary">
            {formatCreditDisplay(creditBalance.credits)}
          </Badge>
        </div>
      )}

      {/* Main prediction button */}
      <div className="space-y-2">
        {hasExistingPrediction ? (
          <Button asChild className="w-full" variant="default">
            <Link href={`/predict/${marketId}`}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Prediction
              <Badge variant="outline" className="ml-2">1-5 credits</Badge>
            </Link>
          </Button>
        ) : (
          <Button 
            asChild 
            className="w-full" 
            variant="default"
            disabled={!basicPredictionCheck.canAfford}
          >
            <Link href={`/predict/${marketId}`}>
              <Zap className="w-4 h-4 mr-2" />
              Predict with AI
              <Badge variant="outline" className="ml-2">1-5 credits</Badge>
            </Link>
          </Button>
        )}

        {/* Credit warning */}
        {!basicPredictionCheck.canAfford && basicPredictionCheck.message && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {basicPredictionCheck.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Additional info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Select 1-5 AI models for your prediction</p>
        <p>• Each model costs 1 credit</p>
        <p>• Get 100 free credits daily</p>
      </div>
    </div>
  )
}