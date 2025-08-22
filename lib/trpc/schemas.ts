/**
 * Zod schemas for tRPC input/output validation
 * These schemas automatically handle Prisma Decimal -> number conversion
 */

import { z } from 'zod'

/**
 * Common field schemas
 */
export const DecimalSchema = z.number().transform((val) => val) // superjson handles Decimal -> number
export const DateSchema = z.date().or(z.string().datetime()) // superjson handles Date -> ISO string
export const IdSchema = z.string().min(1)
export const OptionalIdSchema = z.string().optional().nullable()

/**
 * Event schemas - Made more permissive to match actual Prisma data
 */
export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  icon: z.string().nullable(),
  slug: z.string().nullable(),
  tags: z.any().nullable(),
  volume: z.number().nullable(),
  endDate: z.any().nullable(),
  marketProvider: z.string().nullable(),
  updatedAt: z.any().nullable(),
  startDate: z.any().nullable(),
  category: z.string().nullable(),
  providerCategory: z.string().nullable(),
}).passthrough()

/**
 * Market schemas - Made more permissive to match actual Prisma data
 */
export const MarketSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  question: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  icon: z.string().nullable(),
  outcomes: z.array(z.string()),
  outcomePrices: z.array(z.number()), // Decimal[] -> number[]
  volume: z.number().nullable(),
  liquidity: z.number().nullable(),
  endDate: z.any().nullable(),
  updatedAt: z.any().nullable(),
  slug: z.string().nullable(),
  startDate: z.any().nullable(),
  resolutionSource: z.string().nullable(),
  closed: z.boolean().nullable(),
  active: z.boolean().nullable(),
}).passthrough()

export const MarketWithEventSchema = MarketSchema.extend({
  event: EventSchema.nullable(),
})

/**
 * Prediction schemas - Made more permissive to match actual Prisma data
 */
export const PredictionResultSchema = z.object({
  predicted_outcome: z.string().optional(),
  confidence_level: z.string().optional(),
  confidence_score: z.number().optional(),
  reasoning: z.string().optional(),
  market_analysis: z.string().optional(),
  key_factors: z.array(z.string()).optional(),
  outcome_probabilities: z.record(z.string(), z.number()).optional(),
}).nullable().or(z.any()) // Allow any shape or null for flexibility

// Prediction schema that matches DB exactly (after serialization)
export const PredictionSchema = z.object({
  id: z.number(),
  userMessage: z.string(),
  marketId: z.string(), 
  predictionResult: z.any(), // JSON field - can be any shape
  modelName: z.string().nullable(), // DB: String?
  systemPrompt: z.string().nullable(), // DB: String?
  aiResponse: z.string().nullable(), // DB: String?
  createdAt: DateSchema.nullable(), // DB: DateTime?
  outcomes: z.array(z.string()), // DB: String[]
  outcomesProbabilities: z.array(z.number()), // DB: Decimal[] -> serialized to number[]
  userId: z.string().nullable(), // DB: String?
  experimentTag: z.string().nullable(), // DB: String?
  experimentNotes: z.string().nullable(), // DB: String?
})

export const PredictionWithMarketSchema = PredictionSchema.extend({
  market: MarketWithEventSchema.nullable(),
})

/**
 * Prediction Check schemas
 */
export const PredictionCheckSchema = z.object({
  id: z.number(),
  predictionId: z.number().nullable(),
  marketId: IdSchema.nullable(),
  aiProbability: z.number().nullable(), // Serialized Decimal -> number  
  marketProbability: z.number().nullable(), // Serialized Decimal -> number
  delta: z.number().nullable(), // Serialized Decimal -> number
  absDelta: z.number().nullable(), // Serialized Decimal -> number
  marketClosed: z.boolean().nullable(),
  createdAt: DateSchema, // Proper date handling
})

/**
 * Input schemas for mutations
 */
export const CreatePredictionInputSchema = z.object({
  userMessage: z.string().min(1),
  marketId: IdSchema,
  modelName: z.string().optional(),
  systemPrompt: z.string().optional(),
  experimentTag: z.string().optional(),
  experimentNotes: z.string().optional(),
})

export const UpdatePredictionInputSchema = z.object({
  id: z.number(),
  predictionResult: PredictionResultSchema.optional(),
  aiResponse: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  outcomesProbabilities: z.array(z.number()).optional(),
})

/**
 * Common query input schemas
 */
export const PaginationInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.number().optional(),
})

export const MarketFilterInputSchema = z.object({
  eventId: IdSchema.optional(),
  active: z.boolean().optional(),
  tagIds: z.array(IdSchema).optional(),
  sortMode: z.enum(['markets', 'predictions']).default('markets'),
}).merge(PaginationInputSchema)

/**
 * tRPC inferred types - use these instead of manual DTOs
 */
export type EventOutput = z.infer<typeof EventSchema>
export type MarketOutput = z.infer<typeof MarketSchema>
export type MarketWithEventOutput = z.infer<typeof MarketWithEventSchema>
export type PredictionOutput = z.infer<typeof PredictionSchema>
export type PredictionWithMarketOutput = z.infer<typeof PredictionWithMarketSchema>
export type PredictionCheckOutput = z.infer<typeof PredictionCheckSchema>

// Re-export for convenience - these replace the old DTO types
export type PredictionClientSafe = PredictionOutput
export type MarketClientSafe = MarketOutput
export type EventClientSafe = EventOutput
