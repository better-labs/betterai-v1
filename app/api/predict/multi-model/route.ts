import { type NextRequest, NextResponse } from "next/server"
import { initiatePredictionSession, generateSessionId } from "@/lib/services/generate-user-prediction"
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from "@/lib/rate-limit"
import { userQueries } from "@/lib/db/queries"

import type { ApiResponse, UserPredictionRequest } from "@/lib/types"

// Calculate total credits for the API
function calculateTotalCredits(selectedModels: string[]): number {
  // Each model costs 1 credit for now
  return selectedModels.length
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    // Check rate limit for predict endpoint  
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('predict', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000) // 1 hour fallback
      )
    }
    
    const { marketId, selectedModels } = await request.json()

    if (!marketId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: "Market ID is required",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: "At least one AI model must be selected",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Check if user has enough credits
    const totalCredits = calculateTotalCredits(selectedModels)
    const creditBalance = await userQueries.getUserCredits(userId)
    
    if (!creditBalance || creditBalance.credits < totalCredits) {
      const errorResponse: ApiResponse = {
        success: false,
        error: `Insufficient credits. Required: ${totalCredits}, Available: ${creditBalance?.credits || 0}`,
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 402 }) // Payment Required
    }

    // Generate session ID and create prediction request
    const sessionId = generateSessionId()
    const predictionRequest: UserPredictionRequest = {
      marketId,
      userId,
      selectedModels,
      sessionId
    }

    // Initiate the prediction session
    const session = await initiatePredictionSession(predictionRequest)

    // Deduct credits from user account
    const newCreditBalance = creditBalance.credits - totalCredits
    const newTotalSpent = creditBalance.totalCreditsSpent + totalCredits
    await userQueries.updateUserCredits(userId, newCreditBalance, undefined, newTotalSpent)

    // Prepare the response data
    const responseData: ApiResponse = {
      success: true,
      data: {
        sessionId: session.id,
        marketId: session.marketId,
        selectedModels: session.selectedModels,
        status: session.status,
        progress: session.progress,
        totalCredits,
        creditsDeducted: totalCredits
      },
      message: "Prediction session initiated successfully",
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Multi-model prediction error:", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: "Failed to initiate prediction session",
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}