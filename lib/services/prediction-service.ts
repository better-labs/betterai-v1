import { marketQueries, predictionQueries } from '../db/queries'
import type { PredictionResult } from '../types'
import { DEFAULT_MODEL } from '../data/ai-models'
import { parseAIResponse, validateProbability } from '../utils'

interface OpenRouterPredictionResult {
  prediction: string
  probability: number
  reasoning: string
  confidence_level: "High" | "Medium" | "Low"
}

interface PredictionServiceResponse {
  success: boolean
  message: string
  predictionId?: number
  prediction?: PredictionResult
}

/**
 * Generate a new prediction for a specific market using OpenRouter AI
 * @param marketId - The unique identifier of the market (required)
 * @param modelName - The AI model to use for prediction. 
 * @returns Promise<PredictionServiceResponse>
 */
export async function generatePredictionForMarket(marketId: string, modelName?: string): Promise<PredictionServiceResponse> {
  try {
    if (!marketId) {
      return {
        success: false,
        message: "Market ID is required"
      }
    }

    

    // Fetch market data from database
    const market = await marketQueries.getMarketById(marketId)

    if (!market) {
      return {
        success: false,
        message: `Market with ID ${marketId} not found in database`
      }
    }

    // Generate new prediction using OpenRouter API
    console.log(`Generating AI prediction for market: ${marketId}`)
    
    // Generate system and user messages before the fetch call
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
${
  market.description 
    ? `Market Description: ${market.description}` 
    : ''
}
${
  market.endDate 
    ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` 
    : ''
}

Please consider the market context, timing, and any relevant factors when making your prediction.`
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://betterai.com', // Update with your actual domain
        'X-Title': 'BetterAI Prediction Service',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName || DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          },
        ],
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`OpenRouter rate limit exceeded. Please wait before making another request.`)
      }
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    const predictionResult: OpenRouterPredictionResult = parseAIResponse<OpenRouterPredictionResult>(text)

    // Validate and sanitize probability value
    const validatedProbability = validateProbability(predictionResult.probability)

    // Convert OpenRouter format to our internal PredictionResult format
    const internalPredictionResult: PredictionResult = {
      prediction: predictionResult.prediction,
      probability: validatedProbability,
      reasoning: predictionResult.reasoning,
      confidence_level: predictionResult.confidence_level,
    }

    // Store the prediction in database
    const newPrediction = {
      userMessage: market.question,
      marketId: marketId,
      predictionResult: internalPredictionResult,
      probability: validatedProbability.toString(),
      modelName: modelName || DEFAULT_MODEL,
      systemPrompt: systemMessage,
      aiResponse: text,
      createdAt: new Date(),
    }

    const createdPrediction = await predictionQueries.createPrediction(newPrediction)
    
    if (!createdPrediction) {
      return {
        success: false,
        message: "Failed to save prediction to database"
      }
    }

    console.log(`New prediction created and stored with ID: ${createdPrediction.id}`)

    return {
      success: true,
      message: `Successfully generated and saved prediction for market ${marketId}`,
      predictionId: createdPrediction.id,
      prediction: internalPredictionResult
    }

  } catch (error) {
    console.error("Error generating prediction for market:", error)
    const message = error instanceof Error ? error.message : "Unexpected error occurred"

    return {
      success: false,
      message: message
    }
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

        // Generate actual prediction
        const result = await generatePredictionForMarket(marketId)
        
        clearInterval(thinkingInterval)

        if (result.success && result.prediction) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                prediction: result.prediction,
                predictionId: result.predictionId,
              })}\n\n`,
            ),
          )
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: result.message,
              })}\n\n`,
            ),
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
            })}\n\n`,
          ),
        )
        controller.close()
      }
    },
  })
} 