import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eventQueries, marketQueries } from "./db/queries"

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
