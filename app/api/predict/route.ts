import { type NextRequest, NextResponse } from "next/server"
import { generatePredictionForMarket } from "@/lib/services/generate-single-prediction"
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from "@/lib/rate-limit"

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
      return NextResponse.json({ error: "Market ID is required" }, { status: 400 })
    }

    // Use the new prediction service with user context
    const result = await generatePredictionForMarket(marketId, userId, model, userMessage)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ 
      prediction: result.prediction,
      predictionId: result.predictionId,
      message: result.message,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error("Prediction error:", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
