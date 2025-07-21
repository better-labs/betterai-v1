import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { marketId, question, model, dataSources } = await request.json()

    // Build context based on selected data sources
    let context = `Market Question: ${question}\n\n`

    if (dataSources.includes("news")) {
      context +=
        "Recent News Context: Bitcoin has seen increased institutional adoption with several major companies adding BTC to their treasury. Recent ETF approvals have brought more mainstream investment.\n\n"
    }

    if (dataSources.includes("twitter")) {
      context +=
        "Social Sentiment: Twitter sentiment around Bitcoin has been generally bullish, with increased discussion about the $100K target. Key influencers remain optimistic.\n\n"
    }

    if (dataSources.includes("onchain")) {
      context +=
        "On-chain Metrics: Bitcoin network activity remains strong with increasing hash rate and decreasing exchange reserves, indicating long-term holding behavior.\n\n"
    }

    if (dataSources.includes("technical")) {
      context +=
        "Technical Analysis: Bitcoin is currently in an uptrend with key resistance levels at $75K and $85K. RSI indicates room for growth but approaching overbought territory.\n\n"
    }

    const prompt = `${context}

Based on the above context, provide a detailed prediction analysis for this market. Include:
1. Your prediction and confidence level (as a percentage)
2. Key reasoning behind your analysis
3. Recommended outcome (Yes/No)
4. Risk assessment (Low/Medium/High)

Be objective and consider both bullish and bearish factors. Format your response as a structured analysis.`

    const { text } = await generateText({
      model: openai(model === "gpt-4o" ? "gpt-4o" : "gpt-3.5-turbo"),
      prompt,
      maxTokens: 500,
    })

    // Parse the AI response and structure it
    // In a real implementation, you'd want more sophisticated parsing
    const prediction = {
      prediction: text,
      confidence: Math.floor(Math.random() * 30) + 60, // Mock confidence 60-90%
      reasoning: "Analysis based on current market trends, institutional adoption, and technical indicators.",
      recommendedOutcome: Math.random() > 0.4 ? "Yes" : "No",
      riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as "Low" | "Medium" | "High",
    }

    return NextResponse.json({ prediction })
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
