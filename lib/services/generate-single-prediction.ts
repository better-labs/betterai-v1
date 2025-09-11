import { prisma } from '../db/prisma'
import * as marketService from './market-service'
import * as predictionService from './prediction-service'
import { DEFAULT_MODEL } from '../config/ai-models'
import { fetchPredictionFromOpenRouter, type OpenRouterPredictionResult, EmptyContentError } from './openrouter-client'
import type { Market, PredictionResult } from '../types'
import { Decimal } from '@prisma/client/runtime/library'
import { USER_MESSAGE_PREFIX } from '@/lib/utils'

interface PredictionServiceResponse {
  success: boolean
  message: string
  predictionId?: number
  prediction?: PredictionResult
}

function constructPredictionPrompt(market: Market, additionalUserMessageContext?: string, researchContext?: string): { systemMessage: string; userMessage: string } {
  
  const systemMessage = `You are a prediction analysis expert. Analyze the given market and return ONLY valid JSON.

  Assign your prediction to the values in the outcomeProbabilities array.
  Use your best judgement to determine the most likely probabilities for each outcome.

Constraints:
- outcomes: an array of exactly two unique strings describing the two possible outcomes. If the market provides outcome labels, use those exact labels; otherwise infer clear labels from the question.
- outcomesProbabilities: an array of exactly two numbers in [0,1] that sum to 1. The order must correspond 1:1 with outcomes. Use decimals, not percentages.
- prediction: one concise sentence that states the predicted outcome or stance.
- reasoning: concise justification.
- confidence_level: one of "High", "Medium", or "Low".

Output JSON shape (no example values):
{
  "prediction": string,
  "outcomes": string[2],
  "outcomesProbabilities": number[2],
  "reasoning": string,
  "confidence_level": "High" | "Medium" | "Low"
}

JSON Schema (for reference):
{
  "type": "object",
  "additionalProperties": false,
  "required": ["prediction", "outcomes", "outcomesProbabilities", "reasoning", "confidence_level"],
  "properties": {
    "prediction": { "type": "string", "minLength": 1 },
    "outcomes": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 2,
      "maxItems": 2,
      "uniqueItems": true
    },
    "outcomesProbabilities": {
      "type": "array",
      "items": { "type": "number", "minimum": 0, "maximum": 1 },
      "minItems": 2,
      "maxItems": 2,
      "description": "Two numbers that sum to 1 and align with outcomes order"
    },
    "reasoning": { "type": "string", "minLength": 10 },
    "confidence_level": { "type": "string", "enum": ["High", "Medium", "Low"] }
  }
}

IMPORTANT: Return pure JSON only. No markdown, no code fences, no commentary.`

  const userMessage = `${USER_MESSAGE_PREFIX}
  
  Market Outcome 1: "${market.outcomes?.[0]}"
  Market Outcome 2: "${market.outcomes?.[1]}"
  Current Market Probability (Price) for Outcome 1: "${market.outcomePrices?.[0]}"
  Current Market Probability (Price) for Outcome 2: "${market.outcomePrices?.[1]}"

Market: "${market.question}"

${market.description ? `Market Description: ${market.description}` : ''}
${market.endDate ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` : ''}

 ${additionalUserMessageContext ? `Additional context: ${additionalUserMessageContext}` : ''}${researchContext ? `${researchContext}` : ''}`

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

function alignToMarketOrder(
  predOutcomes: string[],
  predProbs: number[],
  marketOutcomes: string[] | null | undefined
) {
  if (!marketOutcomes || marketOutcomes.length !== predOutcomes.length) {
    return { outcomes: predOutcomes, probs: predProbs }
  }

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const indexByLabel = new Map(marketOutcomes.map((o, i) => [normalize(o), i]))

  const alignedOutcomes = Array(predOutcomes.length).fill('') as string[]
  const alignedProbs = Array(predProbs.length).fill(0) as number[]

  predOutcomes.forEach((label, i) => {
    const j = indexByLabel.get(normalize(label))
    if (j !== undefined) {
      // Preserve canonical market label
      alignedOutcomes[j] = marketOutcomes[j]
      alignedProbs[j] = predProbs[i]
    }
  })

  // Fallback: if alignment failed (some blanks), return original
  if (alignedOutcomes.some((o) => !o)) return { outcomes: predOutcomes, probs: predProbs }
  return { outcomes: alignedOutcomes, probs: alignedProbs }
}

async function savePrediction(
  marketId: string,
  userMessage: string,
  modelName: string,
  systemMessage: string,
  predictionResult: PredictionResult,
  aiResponse: string,
  market: Market,
  userId?: string,
  experimentTag?: string,
  experimentNotes?: string
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
    market: {
      connect: { id: marketId }
    },
    userMessage: userMessage,
    predictionResult: internalPredictionResult as any,
    outcomes,
    outcomesProbabilities: probs.map((p) => p != null && Number.isFinite(p) ? new Decimal(p.toString()) : new Decimal('0')),
    modelName,
    systemPrompt: systemMessage,
    aiResponse,
    createdAt: new Date(),
    user: userId ? {
      connect: { id: userId }
    } : undefined, // Connect user if provided
    experimentTag: experimentTag || null,
    experimentNotes: experimentNotes || null,
  }

  const createdPrediction = await predictionService.createPrediction(prisma, newPrediction)
  if (!createdPrediction) {
    throw new Error("Failed to save prediction to database")
  }
  return createdPrediction.id
}

export async function generatePredictionForMarket(marketId: string, userId?: string, modelName?: string, additionalUserMessageContext?: string, experimentTag?: string, experimentNotes?: string, useWebSearch?: boolean, researchContext?: string): Promise<PredictionServiceResponse> {
  try {
    if (!marketId) {
      return { success: false, message: "Market ID is required" }
    }

    const market = await marketService.getMarketById(prisma, marketId)
    if (!market) {
      return { success: false, message: `Market with ID ${marketId} not found in database` }
    }

    console.log(`Generating AI prediction for market: ${marketId}`)
    const model = modelName || DEFAULT_MODEL
    
    
    let useWebSearchModified  = useWebSearch || false;
    if (process.env.NODE_ENV === 'development') {
      useWebSearchModified = false
    }

    const { systemMessage, userMessage } = constructPredictionPrompt(market, additionalUserMessageContext, researchContext)

    await new Promise(resolve => setTimeout(resolve, 2000)) // Increased delay to avoid rate limiting

    let predictionResult: OpenRouterPredictionResult;
    try {
      predictionResult = await fetchPredictionFromOpenRouter(model, systemMessage, userMessage, useWebSearchModified)
    } catch (error) {
      console.error(`Error generating prediction for market ${marketId}:`, error)

      // For other errors, re-throw
      throw error
      
    }

    const predictionId = await savePrediction(
      marketId,
      userMessage,
      model,
      systemMessage,
      predictionResult,
      JSON.stringify(predictionResult),
      market,
      userId,
      experimentTag,
      experimentNotes
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
