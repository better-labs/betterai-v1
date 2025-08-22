import { z } from 'zod'

// Base API response schema that all endpoints follow
export const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})

// Enhanced ApiResponse schema with data
export const ApiResponseWithDataSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  BaseApiResponseSchema.extend({
    data: dataSchema.optional(),
  })

// OpenRouter API response validation schemas
export const OpenRouterPredictionSchema = z.object({
  prediction: z.string().min(1),
  outcomes: z.array(z.string().min(1)).length(2),
  outcomesProbabilities: z.array(z.number().min(0).max(1)).length(2),
  reasoning: z.string().min(10),
  confidence_level: z.enum(["High", "Medium", "Low"])
})

export const OpenRouterApiResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.string(),
      content: z.string().nullable(),
      tool_calls: z.array(z.object({
        id: z.string(),
        type: z.string(),
        function: z.object({
          name: z.string(),
          arguments: z.string()
        })
      })).optional()
    }),
    finish_reason: z.string()
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number()
  }).optional()
})

// Polymarket API response validation schemas
export const PolymarketTagSchema = z.object({
  id: z.string(),
  label: z.string(),
  slug: z.string(),
  forceShow: z.boolean(),
  updatedAt: z.string()
})

// DTO schemas for validated API responses (with strings)
export const PolymarketMarketDTOSchema = z.object({
  id: z.string(),
  question: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  outcomePrices: z.string(), // JSON string
  outcomes: z.string().optional(), // JSON string array
  volume: z.string(),
  liquidity: z.string(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  resolutionSource: z.string().optional(),
  eventId: z.string().optional()
})

export const PolymarketEventDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  icon: z.string(),
  image: z.string().optional(),
  tags: z.array(PolymarketTagSchema),
  volume: z.number(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  markets: z.array(PolymarketMarketDTOSchema),
  category: z.string()
})

// Legacy schemas for backward compatibility
export const PolymarketMarketSchema = PolymarketMarketDTOSchema
export const PolymarketEventSchema = PolymarketEventDTOSchema

// Prediction API response schemas
export const PredictionResultSchema = z.object({
  prediction: z.string(),
  outcomes: z.array(z.string()),
  outcomesProbabilities: z.array(z.number().min(0).max(1)),
  reasoning: z.string(),
  confidence_level: z.enum(["High", "Medium", "Low"])
})

export const PredictionDTOSchema = z.object({
  id: z.string(),
  userMessage: z.string(),
  marketId: z.string(),
  predictionResult: PredictionResultSchema,
  modelName: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  aiResponse: z.string().nullable(),
  createdAt: z.string().datetime(),
  outcomes: z.array(z.string()),
  outcomesProbabilities: z.array(z.number()),
  userId: z.string().nullable(),
  experimentTag: z.string().nullable(),
  experimentNotes: z.string().nullable()
})

export const PredictionApiResponseSchema = BaseApiResponseSchema.extend({
  data: z.object({
    prediction: PredictionDTOSchema,
    creditsConsumed: z.number().min(0),
    remainingCredits: z.number().min(0)
  }).optional()
})

// Market/Event API response schemas
export const MarketDTOSchema = z.object({
  id: z.string(),
  question: z.string(),
  eventId: z.string(),
  outcomePrices: z.array(z.number().min(0).max(1)),
  volume: z.number().min(0).nullable(),
  liquidity: z.number().min(0).nullable(),
  description: z.string().nullable(),
  active: z.boolean().nullable(),
  closed: z.boolean().nullable(),
  endDate: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  slug: z.string().nullable(),
  startDate: z.string().datetime().nullable(),
  resolutionSource: z.string().nullable(),
  outcomes: z.array(z.string()),
  icon: z.string().nullable(),
  image: z.string().nullable()
})

export const EventDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  tags: z.unknown().nullable(),
  volume: z.number().nullable(),
  endDate: z.string().datetime().nullable(),
  marketProvider: z.string().nullable(),
  updatedAt: z.string().datetime().nullable(),
  startDate: z.string().datetime().nullable(),
  category: z.string().nullable(),
  providerCategory: z.string().nullable()
})

export const MarketListApiResponseSchema = BaseApiResponseSchema.extend({
  data: z.object({
    markets: z.array(MarketDTOSchema),
    totalCount: z.number().min(0),
    page: z.number().min(1),
    limit: z.number().min(1).max(100)
  }).optional()
})

export const EventListApiResponseSchema = BaseApiResponseSchema.extend({
  data: z.array(EventDTOSchema).optional()
})

export const SingleMarketApiResponseSchema = BaseApiResponseSchema.extend({
  data: MarketDTOSchema.optional()
})

export const SingleEventApiResponseSchema = BaseApiResponseSchema.extend({
  data: EventDTOSchema.optional()
})

// Credit system schemas (already exist but importing for completeness)
export { CreditsApiResponseSchema } from './credits'
