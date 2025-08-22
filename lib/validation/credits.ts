import { z } from 'zod'

// Schema for credits API response validation
export const CreditsApiResponseSchema = z.object({
  credits: z.object({
    credits: z.number(),
    creditsLastReset: z.string().datetime(), // Validates ISO date string
    totalCreditsEarned: z.number(),
    totalCreditsSpent: z.number()
  }).nullable(),
  isAuthenticated: z.boolean(),
  message: z.string().optional()
})

// Helper function to validate and parse API responses
export function validateCreditsResponse(data: unknown) {
  try {
    return CreditsApiResponseSchema.parse(data)
  } catch (error) {
    console.error('Credits API response validation failed:', error)
    throw new Error('Invalid credits data received from API')
  }
}

// Safe date parser for client-side date handling
export function parseApiDate(dateString: string): Date {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`)
  }
  return date
}
