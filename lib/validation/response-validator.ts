import { z } from 'zod'

export class ApiResponseValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: z.ZodError,
    public originalData: unknown
  ) {
    super(message)
    this.name = 'ApiResponseValidationError'
  }
}

export function createResponseValidator<T extends z.ZodSchema>(schema: T) {
  return function validateResponse(data: unknown): z.infer<T> {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Minimal logging to reduce noise
        if (process.env.NODE_ENV !== 'production') {
          console.error('API Response validation failed:', {
            errors: error.errors.slice(0, 5), // Only log first 5 errors
            totalErrors: error.errors.length,
            data: typeof data === 'object' ? `[Object with ${Object.keys(data as any).length} properties]` : typeof data
          })
        }
        
        // Create user-friendly error message
        const fieldErrors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        
        throw new ApiResponseValidationError(
          `Invalid API response: ${fieldErrors}`,
          error,
          data
        )
      }
      throw error
    }
  }
}

// Helper function for graceful validation that doesn't throw
export function createSafeResponseValidator<T extends z.ZodSchema>(schema: T) {
  return function validateResponseSafe(data: unknown): { success: true; data: z.infer<T> } | { success: false; error: string } {
    try {
      const result = schema.parse(data)
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        
        // Minimal logging to reduce noise
        if (process.env.NODE_ENV !== 'production') {
          console.error('API Response validation failed:', {
            errors: error.errors.slice(0, 5), // Only log first 5 errors
            totalErrors: error.errors.length,
            data: typeof data === 'object' ? `[Object with ${Object.keys(data as any).length} properties]` : typeof data
          })
        }
        
        return { 
          success: false, 
          error: `Invalid API response: ${fieldErrors}` 
        }
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      }
    }
  }
}

// Usage helpers for common validation patterns
import {
  CreditsApiResponseSchema,
  OpenRouterApiResponseSchema,
  OpenRouterPredictionSchema,
  PolymarketEventSchema,
  PolymarketMarketSchema,
  PredictionApiResponseSchema,
  MarketListApiResponseSchema,
  EventListApiResponseSchema,
  SingleMarketApiResponseSchema,
  SingleEventApiResponseSchema
} from './api-responses'

// Strict validators (throw on error)
export const validateCreditsResponse = createResponseValidator(CreditsApiResponseSchema)
export const validateOpenRouterResponse = createResponseValidator(OpenRouterApiResponseSchema)
export const validateOpenRouterPrediction = createResponseValidator(OpenRouterPredictionSchema)
export const validatePolymarketEvent = createResponseValidator(PolymarketEventSchema)
export const validatePolymarketMarket = createResponseValidator(PolymarketMarketSchema)
export const validatePredictionResponse = createResponseValidator(PredictionApiResponseSchema)
export const validateMarketListResponse = createResponseValidator(MarketListApiResponseSchema)
export const validateEventListResponse = createResponseValidator(EventListApiResponseSchema)
export const validateSingleMarketResponse = createResponseValidator(SingleMarketApiResponseSchema)
export const validateSingleEventResponse = createResponseValidator(SingleEventApiResponseSchema)

// Safe validators (return success/error objects)
export const validateCreditsResponseSafe = createSafeResponseValidator(CreditsApiResponseSchema)
export const validateOpenRouterResponseSafe = createSafeResponseValidator(OpenRouterApiResponseSchema)
export const validateOpenRouterPredictionSafe = createSafeResponseValidator(OpenRouterPredictionSchema)
export const validatePolymarketEventSafe = createSafeResponseValidator(PolymarketEventSchema)
export const validatePolymarketMarketSafe = createSafeResponseValidator(PolymarketMarketSchema)
export const validatePredictionResponseSafe = createSafeResponseValidator(PredictionApiResponseSchema)
export const validateMarketListResponseSafe = createSafeResponseValidator(MarketListApiResponseSchema)
export const validateEventListResponseSafe = createSafeResponseValidator(EventListApiResponseSchema)
export const validateSingleMarketResponseSafe = createSafeResponseValidator(SingleMarketApiResponseSchema)
export const validateSingleEventResponseSafe = createSafeResponseValidator(SingleEventApiResponseSchema)
