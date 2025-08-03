import type { NextRequest } from "next/server"
import { generatePredictionStream } from "@/lib/services/prediction-service"

export async function POST(request: NextRequest) {
  const { marketId, userMessage, model, dataSources } = await request.json()

  if (!marketId) {
    return new Response(
      JSON.stringify({ error: "Market ID is required" }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  // Use the new prediction service with streaming
  const stream = await generatePredictionStream(marketId)

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
