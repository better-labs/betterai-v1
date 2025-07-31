import { type NextRequest, NextResponse } from "next/server"
import { generatePredictionForMarket } from "@/lib/services/prediction-service"

export async function POST(request: NextRequest) {
  try {
    const { marketId, question, model, dataSources } = await request.json()

    if (!marketId) {
      return NextResponse.json({ error: "Market ID is required" }, { status: 400 })
    }

    // Use the new prediction service
    const result = await generatePredictionForMarket(marketId)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ 
      prediction: result.prediction,
      predictionId: result.predictionId,
      message: result.message 
    })
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
