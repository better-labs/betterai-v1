import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eventQueries, marketQueries } from "./db/queries"
import type { Prediction, Market } from "./types"
import { z } from "zod"
import type { PredictionResult } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a volume number to display as $##k or $##m format
 * Examples: 34410 -> "$34k", 1996731 -> "$2m", 110017 -> "$110k"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}m`
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}k`
  } else {
    return `$${volume.toFixed(0)}`
  }
}

/**
 * Safely parse JSON from AI model responses, handling markdown formatting
 * @param text - The raw text response from the AI model
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be parsed even after cleaning
 */
export function parseAIResponse<T>(text: string): T {
  try {
    // First attempt: direct JSON parsing
    return JSON.parse(text);
  } catch {
    // Second attempt: handle markdown-wrapped JSON and other non-JSON text
    let cleanedText = text.trim();

    // Remove <think>...</think> blocks
    const thinkTagEnd = cleanedText.lastIndexOf('</think>');
    if (thinkTagEnd !== -1) {
      cleanedText = cleanedText.substring(thinkTagEnd + '</think>'.length).trim();
    }

    // Remove markdown code blocks (```json ... ```)
    if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(7, -3).trim();
    } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(3, -3).trim();
    }

    // Remove any remaining backticks
    cleanedText = cleanedText.replace(/^`+|`+$/g, '').trim();

    try {
      const result = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON after cleaning formatting');
      return result;
    } catch {
      console.error('AI response was not valid JSON even after cleaning:', text);
      console.error('Cleaned text:', cleanedText);
      throw new Error(`AI model returned invalid JSON response. Raw response: ${text.substring(0, 200)}...`);
    }
  }
}

// Runtime schema validation for AI prediction result
const PredictionResultSchema = z
  .object({
    prediction: z.string().min(1),
    outcomes: z
      .array(z.string().min(1))
      .length(2)
      .refine((arr) => new Set(arr).size === 2, {
        message: "outcomes must contain two unique labels",
      }),
    outcomesProbabilities: z
      .array(z.number().min(0).max(1))
      .length(2)
      .refine((arr) => Math.abs(arr[0] + arr[1] - 1) < 1e-6, {
        message: "outcomesProbabilities must sum to 1",
      }),
    reasoning: z.string().min(10),
    confidence_level: z.enum(["High", "Medium", "Low"]),
  })
  .strict()

export function validatePredictionResult(result: unknown): PredictionResult {
  const parsed = PredictionResultSchema.parse(result)
  return parsed as PredictionResult
}

/**
 * Validates and sanitizes probability values from AI responses
 * @param probability - The probability value from AI response
 * @returns Validated probability value between 0 and 1
 * @throws Error if probability is invalid
 */
export function validateProbability(probability: unknown): number {
  // Check if probability is a valid number
  if (typeof probability !== 'number' || isNaN(probability)) {
    console.error('Invalid probability value:', probability)
    throw new Error('AI model returned invalid probability value')
  }

  // Ensure probability is between 0 and 1
  return Math.max(0, Math.min(1, probability))
}

/**
 * Formats a value as a percentage string, accepting 0..1 or 0..100 inputs.
 * Returns '—' for null/invalid values.
 */
export function formatPercent(value: unknown): string {
  if (value == null) return '—'
  let num: number | null = null
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value)
    num = Number.isFinite(parsed) ? parsed : null
  } else if (typeof value === 'object') {
    const anyVal = value as any
    if (typeof anyVal?.toNumber === 'function') {
      try { num = anyVal.toNumber() } catch { num = null }
    } else if (typeof anyVal?.toString === 'function') {
      const parsed = parseFloat(anyVal.toString())
      num = Number.isFinite(parsed) ? parsed : null
    }
  }
  if (num == null || !Number.isFinite(num)) return '—'
  const percent = num <= 1 ? num * 100 : num
  return `${Math.round(percent)}%`
}

/**
 * Normalizes probabilities to 0..1 range from 0..1 or 0..100 inputs.
 */
export function toUnitProbability(value: unknown): number | null {
  if (value == null) return null
  let num: number | null = null
  if (typeof value === 'number') {
    num = value
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value)
    num = Number.isFinite(parsed) ? parsed : null
  } else if (typeof value === 'object') {
    const anyVal = value as any
    if (typeof anyVal?.toNumber === 'function') {
      try { num = anyVal.toNumber() } catch { num = null }
    } else if (typeof anyVal?.toString === 'function') {
      const parsed = parseFloat(anyVal.toString())
      num = Number.isFinite(parsed) ? parsed : null
    }
  }
  if (num == null || !Number.isFinite(num)) return null
  if (num > 1) return num / 100
  if (num >= 0) return num
  return null
}

/**
 * Converts various possible numeric-like values to a number or null.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : null
  }
  try {
    const n = Number(value as any)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/**
 * Derives display-friendly fields from a prediction record.
 * - aiProbability from `outcomesProbabilities[0]` or by parsing `aiResponse`
 * - reasoning from `aiResponse`
 * - marketProbability from the related market's `outcomePrices[0]`
 */
export function getPredictionDisplayData(
  prediction: Prediction & { market: (Market & { event?: any }) | null }
): { aiProbability: number; reasoning: string | null; marketProbability: number | null } {
  let aiProbability = 0
  let reasoning: string | null = null
  let marketProbability: number | null = null

  // AI probability from stored array
  const p0 = Array.isArray((prediction as any).outcomesProbabilities)
    ? (prediction as any).outcomesProbabilities[0]
    : null
  const p0Num = toNumberOrNull(p0)
  if (p0Num !== null) {
    aiProbability = Math.round(p0Num * 100)
  } else if (prediction.aiResponse) {
    // Fallback: parse aiResponse
    try {
      const parsed = JSON.parse(prediction.aiResponse as unknown as string)
      const arr = (parsed as any)?.outcomesProbabilities
      const first = Array.isArray(arr) ? toNumberOrNull(arr[0]) : null
      if (first !== null) aiProbability = Math.round(first * 100)
      if (parsed && typeof parsed === 'object' && 'reasoning' in parsed) {
        reasoning = String((parsed as any).reasoning)
      }
    } catch {}
  }

  // Reasoning if not already set
  if (!reasoning && prediction.aiResponse) {
    try {
      const parsed = JSON.parse(prediction.aiResponse as unknown as string)
      if (parsed && typeof parsed === 'object' && 'reasoning' in parsed) {
        reasoning = String((parsed as any).reasoning)
      }
    } catch {}
  }

  // Market probability
  const firstPrice = Array.isArray(prediction.market?.outcomePrices)
    ? (prediction.market as any).outcomePrices[0]
    : (prediction.market as any)?.outcomePrices?.[0]
  const priceNum = toNumberOrNull(firstPrice)
  if (priceNum !== null) marketProbability = Math.round(priceNum * 100)

  return { aiProbability, reasoning, marketProbability }
}

/**
 * Builds a canonical external URL for an event on its source market provider
 * using the stored `slug` and `marketProvider`.
 *
 * Example: polymarket → https://polymarket.com/event/<slug>
 */
export async function generateEventURL(eventId: string): Promise<string | null> {
  if (!eventId) return null

  // Fetch event to get slug and provider
  const event = await eventQueries.getEventById(eventId)
  if (!event || !event.slug) return null

  const providerRaw = (event.marketProvider || 'polymarket').trim().toLowerCase()

  // Map known providers to their domains; default to <provider>.com
  let domain: string
  switch (providerRaw) {
    case 'polymarket':
      domain = 'polymarket.com'
      break
    case 'kalshi':
      domain = 'kalshi.com'
      break
    default:
      domain = `${providerRaw}.com`
  }

  return `https://${domain}/event/${encodeURIComponent(event.slug)}`
}

// Alias helper matching requested name in other parts of the app/spec
export async function getEventURL(eventId: string): Promise<string | null> {
  return generateEventURL(eventId)
}

/**
 * Builds a canonical external URL for a market by composing the event URL
 * with the market slug: <event-url>/<market-slug>
 */
export async function generateMarketURL(marketId: string): Promise<string | null> {
  if (!marketId) return null

  const market = await marketQueries.getMarketById(marketId)
  if (!market) return null

  const baseEventUrl = market.eventId ? await getEventURL(market.eventId) : null
  if (!baseEventUrl) return null

  const marketSlug = market.slug ? `/${encodeURIComponent(market.slug)}` : ''
  return `${baseEventUrl}${marketSlug}`
}
