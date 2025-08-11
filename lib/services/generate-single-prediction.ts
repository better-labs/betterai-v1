import { marketQueries, predictionQueries, DEFAULT_MODEL } from '../db/queries'
import { fetchPredictionFromOpenRouter } from './openrouter-client'
import type { Market, PredictionResult } from '../types'
import { Decimal } from '@prisma/client/runtime/library'

interface PredictionServiceResponse {
  success: boolean
  message: string
  predictionId?: number
  prediction?: PredictionResult
}

function constructPredictionPrompt(market: Market, additionalUserMessageContext?: string): { systemMessage: string; userMessage: string } {
  
  const systemMessage = `You are a prediction analysis expert. Analyze the given market and provide a structured prediction with probability, reasoning, and confidence level.

Format your response as a JSON object with the following structure:
{
  "outcomes": ["Yes", "No"],
  "outcomesProbabilities": [0.75, 0.25],
  "reasoning": "detailed explanation of your reasoning",
  "confidence_level": "High/Medium/Low"
}

IMPORTANT: Return ONLY a valid JSON object. Do NOT wrap your response in markdown code blocks, backticks, or any other formatting. Return pure JSON.
IMPORTANT: The outcomesProbabilities values must be decimal values between 0 and 1. Do not use percentages, text, or any other format.
IMPORTANT: the sum total of the two outcomesProbabilities must equal 1
`

  const userMessage = `Analyze this market and provide a comprehensive prediction for the outcome:"${market.outcomes?.[0]}":

Market: "${market.question}"


Please consider the market context, timing, and any relevant factors when making your prediction.
${market.description ? `Market Description: ${market.description}` : ''}
${market.endDate ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` : ''}

${additionalUserMessageContext ? `Additional context: ${additionalUserMessageContext}` : ''}`

  return { systemMessage, userMessage }
}

function isValidProbArray(values: number[]): boolean {
  if (!Array.isArray(values) || values.length === 0) return false
  let sum = 0
  for (const v of values) {
    if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 1) return false
    sum += v
  }
  return Math.abs(sum - 1) < 1e-6
}

function alignToMarketOrder(predOutcomes: string[], predProbs: number[], marketOutcomes: string[] | null | undefined) {
  if (!marketOutcomes || marketOutcomes.length !== predOutcomes.length) {
    return { outcomes: predOutcomes, probs: predProbs }
  }
  const indexByLabel = new Map(marketOutcomes.map((o, i) => [o, i]))
  const alignedOutcomes = Array(predOutcomes.length).fill('')
  const alignedProbs = Array(predProbs.length).fill(0)
  predOutcomes.forEach((label, i) => {
    const j = indexByLabel.get(label)
    if (j !== undefined) {
      alignedOutcomes[j] = label
      alignedProbs[j] = predProbs[i]
    }
  })
  // Fallback: if alignment failed (some blanks), return original
  if (alignedOutcomes.some(o => !o)) return { outcomes: predOutcomes, probs: predProbs }
  return { outcomes: alignedOutcomes, probs: alignedProbs }
}

async function savePrediction(
  marketId: string,
  userMessage: string,
  modelName: string,
  systemMessage: string,
  predictionResult: PredictionResult,
  aiResponse: string,
  market: Market
): Promise<number> {
  // Validate arrays
  if (!Array.isArray(predictionResult.outcomes) || !Array.isArray(predictionResult.outcomesProbabilities)) {
    throw new Error('Prediction result missing outcomes or outcomesProbabilities array')
  }
  if (predictionResult.outcomes.length !== predictionResult.outcomesProbabilities.length) {
    throw new Error('outcomes and outcomesProbabilities must have the same length')
  }
  if (!isValidProbArray(predictionResult.outcomesProbabilities)) {
    throw new Error('outcomesProbabilities must be numbers in [0,1] and sum to 1')
  }

  // Align to market order when labels match
  const { outcomes, probs } = alignToMarketOrder(
    predictionResult.outcomes,
    predictionResult.outcomesProbabilities,
    market.outcomes
  )

  const internalPredictionResult: PredictionResult = {
    ...predictionResult,
    outcomes,
    outcomesProbabilities: probs,
  }

  const newPrediction = {
    marketId,
    userMessage: userMessage,
    predictionResult: internalPredictionResult,
    outcomes,
    outcomesProbabilities: probs.map((p) => new Decimal(p)),
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

export async function generatePredictionForMarket(marketId: string, modelName?: string, additionalUserMessageContext?: string): Promise<PredictionServiceResponse> {
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
    const { systemMessage, userMessage } = constructPredictionPrompt(market, additionalUserMessageContext)

    await new Promise(resolve => setTimeout(resolve, 1000)) // Delay to avoid rate limiting

    const predictionResult = await fetchPredictionFromOpenRouter(model, systemMessage, userMessage)

    const predictionId = await savePrediction(
      marketId,
      userMessage,
      model,
      systemMessage,
      predictionResult,
      JSON.stringify(predictionResult),
      market
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