import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
    return JSON.parse(text)
  } catch (parseError) {
    // Second attempt: handle markdown-wrapped JSON
    let cleanedText = text.trim()
    
    // Remove markdown code blocks (```json ... ```)
    if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(7, -3).trim()
    } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(3, -3).trim()
    }
    
    // Remove any remaining backticks
    cleanedText = cleanedText.replace(/^`+|`+$/g, '').trim()
    
    try {
      const result = JSON.parse(cleanedText)
      console.log("Successfully parsed JSON after cleaning markdown formatting")
      return result
    } catch (secondParseError) {
      console.error("AI response was not valid JSON even after cleaning:", text)
      console.error("Cleaned text:", cleanedText)
      throw new Error(`AI model returned invalid JSON response. Raw response: ${text.substring(0, 200)}...`)
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
