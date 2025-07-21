import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const { marketId, question, model, dataSources } = await request.json()

  // Create a readable stream for SSE
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial thinking message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "thinking",
            message: "Analyzing market data and trends...",
          })}\n\n`,
        ),
      )

      // Simulate AI processing with multiple thinking steps
      const thinkingSteps = [
        "Analyzing market data and trends...",
        "Processing news sentiment...",
        "Evaluating technical indicators...",
        "Calculating confidence scores...",
        "Generating final prediction...",
      ]

      let stepIndex = 0
      const thinkingInterval = setInterval(() => {
        if (stepIndex < thinkingSteps.length) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "thinking",
                message: thinkingSteps[stepIndex],
                progress: ((stepIndex + 1) / thinkingSteps.length) * 100,
              })}\n\n`,
            ),
          )
          stepIndex++
        }
      }, 400)

      // Send final result after 2 seconds
      setTimeout(() => {
        clearInterval(thinkingInterval)

        // Generate mock prediction based on market question
        const mockPredictions = {
          "Will Bitcoin reach $100,000 by end of 2024?": {
            prediction:
              "Based on current market trends, institutional adoption patterns, and technical analysis, there is a strong probability that Bitcoin will reach $100,000 by end of 2024. Key factors include increasing institutional demand, potential ETF approvals, and the upcoming halving event.",
            confidence: 78,
            reasoning:
              "Analysis shows positive momentum from institutional adoption (BlackRock ETF approval), decreasing exchange reserves indicating long-term holding, and historical post-halving price patterns. However, regulatory uncertainty and macroeconomic headwinds present downside risks.",
            recommendedOutcome: "Yes",
            riskLevel: "Medium" as const,
            keyFactors: [
              "Institutional adoption accelerating",
              "ETF approvals driving demand",
              "Post-halving historical patterns",
              "Decreasing exchange reserves",
            ],
            riskFactors: ["Regulatory uncertainty", "Macroeconomic headwinds", "Market volatility"],
          },
          "Will the Lakers make the NBA playoffs?": {
            prediction:
              "The Lakers have a moderate chance of making the playoffs based on current roster strength, injury status, and remaining schedule difficulty. LeBron and AD's health will be crucial factors.",
            confidence: 65,
            reasoning:
              "Strong veteran leadership with LeBron James and Anthony Davis, but injury concerns and competitive Western Conference present challenges. Recent trades have improved depth.",
            recommendedOutcome: "Yes",
            riskLevel: "High" as const,
            keyFactors: ["LeBron James leadership", "Anthony Davis when healthy", "Recent roster improvements"],
            riskFactors: ["Injury history", "Competitive Western Conference", "Age-related decline"],
          },
        }

        const prediction = mockPredictions[question as keyof typeof mockPredictions] || {
          prediction:
            "Based on available data and market analysis, this outcome shows moderate probability with several key factors to consider.",
          confidence: Math.floor(Math.random() * 30) + 60,
          reasoning:
            "Analysis incorporates multiple data sources including market trends, historical patterns, and current sentiment indicators.",
          recommendedOutcome: Math.random() > 0.5 ? "Yes" : "No",
          riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as "Low" | "Medium" | "High",
          keyFactors: ["Current market conditions", "Historical trend analysis", "Sentiment indicators"],
          riskFactors: ["Market volatility", "External factors", "Uncertainty in predictions"],
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              prediction,
            })}\n\n`,
          ),
        )

        controller.close()
      }, 2000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
