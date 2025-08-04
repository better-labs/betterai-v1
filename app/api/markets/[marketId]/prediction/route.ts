import { type NextRequest, NextResponse } from "next/server"
import { getMostRecentPredictionByMarketId } from "@/lib/data/predictions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  try {
    const { marketId } = await params

    if (!marketId) {
      return NextResponse.json({ error: "Market ID is required" }, { status: 400 })
    }

    const prediction = await getMostRecentPredictionByMarketId(marketId)

    if (!prediction) {
      return NextResponse.json({ prediction: null }, { status: 200 })
    }

    return NextResponse.json({ 
      prediction: prediction.predictionResult,
      createdAt: prediction.createdAt,
      modelName: prediction.modelName
    })
  } catch (error) {
    console.error("Failed to fetch market prediction:", error)
    return NextResponse.json({ error: "Failed to fetch market prediction" }, { status: 500 })
  }
} 