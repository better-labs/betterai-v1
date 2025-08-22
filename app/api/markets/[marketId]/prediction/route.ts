import { type NextRequest, NextResponse } from "next/server"
import { predictionQueries } from "@/lib/db/queries"
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"
import { serializeDecimals } from "@/lib/serialization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    const { marketId } = await params

    if (!marketId) {
      return NextResponse.json({ error: "Market ID is required" }, { status: 400 })
    }

    const prediction = await predictionQueries.getMostRecentPredictionByMarketIdSerialized(marketId)

    if (!prediction) {
      return NextResponse.json({ prediction: null }, { status: 200 })
    }

    // Serialize the prediction to handle Decimal objects
    return NextResponse.json({
      prediction: prediction.predictionResult,
      createdAt: prediction.createdAt,
      modelName: prediction.modelName,
      authenticatedUser: userId
    })
  } catch (error) {
    console.error("Failed to fetch market prediction:", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: "Failed to fetch market prediction" }, { status: 500 })
  }
} 