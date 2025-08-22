import { type NextRequest, NextResponse } from "next/server"
import { generatePredictionForMarket } from "@/lib/services/generate-single-prediction"
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from "@/lib/rate-limit"

import type { ApiResponse } from "@/lib/types"

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
    
    const { marketId, userMessage, model, dataSources } = await request.json()

    if (!marketId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: "Market ID is required",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Use the new prediction service with user context
    const result = await generatePredictionForMarket(marketId, userId, model, userMessage)

    if (!result.success) {
      const errorResponse: ApiResponse = {
        success: false,
        error: result.message || "Failed to generate prediction",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Prepare the response data
    const responseData: ApiResponse = {
      success: true,
      data: {
        prediction: result.prediction,
        predictionId: result.predictionId,
        authenticatedUser: userId
      },
      message: result.message,
      timestamp: new Date().toISOString()
    }

    // Note: We could add validation here if we had a specific schema for this response
    // For now, using the consistent ApiResponse format provides structure
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Prediction error:", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: "Failed to generate prediction",
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
