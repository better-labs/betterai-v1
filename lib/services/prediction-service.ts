import { marketQueries, predictionQueries, DEFAULT_MODEL, NewPrediction } from '../db/queries'
import { validateProbability } from '../utils'
import { fetchPredictionFromOpenRouter } from './openrouter-client'
import type { Market, PredictionResult } from '../types'
import { Decimal } from '@prisma/client/runtime/library'

interface PredictionServiceResponse {
  success: boolean
  message: string
  predictionId?: number
  prediction?: PredictionResult
}

function constructPredictionPrompt(market: Market): { systemMessage: string; userMessage: string } {
  const systemMessage = `You are a prediction analysis expert. Analyze the given market and provide a structured prediction with probability, reasoning, and confidence level.

Format your response as a JSON object with the following structure:
{
  "prediction": "your prediction outcome",
  "probability": 0.XX (must be a number between 0 and 1, e.g., 0.75 for 75%),
  "reasoning": "detailed explanation of your reasoning",
  "confidence_level": "High/Medium/Low"
}

IMPORTANT: Return ONLY a valid JSON object. Do NOT wrap your response in markdown code blocks, backticks, or any other formatting. Return pure JSON.
IMPORTANT: The probability field must be a numeric value between 0 and 1. Do not use percentages, text, or any other format.`

  const userMessage = `Analyze this market and provide a comprehensive prediction:

Market: "${market.question}"
${market.description ? `Market Description: ${market.description}` : ''}
${market.endDate ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` : ''}

Please consider the market context, timing, and any relevant factors when making your prediction.`

  return { systemMessage, userMessage }
}

async function savePrediction(
  marketId: string,
  marketQuestion: string,
  modelName: string,
  systemMessage: string,
  predictionResult: PredictionResult,
  aiResponse: string
): Promise<number> {
  const validatedProbability = validateProbability(predictionResult.probability)
  const internalPredictionResult: PredictionResult = {
    ...predictionResult,
    probability: validatedProbability,
  }

  const newPrediction = {
    marketId,
    userMessage: marketQuestion,
    predictionResult: internalPredictionResult as any,
    probability: new Decimal(validatedProbability),
    modelName,
    systemPrompt: systemMessage,
    aiResponse,
    createdAt: new Date(),
  }

  const createdPrediction = await predictionQueries.createPrediction(newPrediction)
  if (!createdPrediction) {
    throw new Error("Failed to save prediction to database")
  }
  return createdPrediction.id
}

export async function generatePredictionForMarket(marketId: string, modelName?: string): Promise<PredictionServiceResponse> {
  try {
    if (!marketId) {
      return { success: false, message: "Market ID is required" }
    }

    const market = await marketQueries.getMarketById(marketId)
    if (!market) {
      return { success: false, message: `Market with ID ${marketId} not found in database` }
    }

    console.log(`Generating AI prediction for market: ${marketId}`)
    const model = modelName || DEFAULT_MODEL
    const { systemMessage, userMessage } = constructPredictionPrompt(market)

    await new Promise(resolve => setTimeout(resolve, 1000)) // Delay to avoid rate limiting

    const predictionResult = await fetchPredictionFromOpenRouter(model, systemMessage, userMessage)

    const predictionId = await savePrediction(
      marketId,
      market.question,
      model,
      systemMessage,
      predictionResult,
      JSON.stringify(predictionResult)
    )

    console.log(`New prediction created and stored with ID: ${predictionId}`)

    return {
      success: true,
      message: `Successfully generated and saved prediction for market ${marketId}`,
      predictionId,
      prediction: predictionResult,
    }
  } catch (error) {
    console.error("Error generating prediction for market:", error)
    const message = error instanceof Error ? error.message : "Unexpected error occurred"
    return { success: false, message }
  }
}

/**
 * Generate a prediction with streaming response for real-time updates
 * @param marketId - The unique identifier of the market
 * @returns Promise<ReadableStream>
 */
export async function generatePredictionStream(marketId: string): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const thinkingSteps = [
          "Analyzing market data and trends...",
          "Processing news sentiment...",
          "Evaluating technical indicators...",
          "Calculating confidence scores...",
          "Generating final prediction...",
        ]

        for (let i = 0; i < thinkingSteps.length; i++) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "thinking",
                message: thinkingSteps[i],
                progress: ((i + 1) / thinkingSteps.length) * 100,
              })}\n\n`
            )
          )
          await new Promise(resolve => setTimeout(resolve, 400))
        }

        const result = await generatePredictionForMarket(marketId)

        if (result.success && result.prediction) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                prediction: result.prediction,
                predictionId: result.predictionId,
              })}\n\n`
            )
          )
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: result.message,
              })}\n\n`
            )
          )
        }
        controller.close()
      } catch (error) {
        console.error("Stream error:", error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Failed to generate prediction",
            })}\n\n`
          )
        )
        controller.close()
      }
    },
  })
} 