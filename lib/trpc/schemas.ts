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
  slug: z.string(),
  active: z.boolean().optional().default(true),
  hidden: z.boolean().nullable(),
  volume: z.number().nullable(),
  endDate: z.any().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
}).passthrough() // Allow additional fields

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
  outcomes: z.array(z.string()).optional().default([]),
  outcomePrices: z.array(z.number()).optional().default([]), // Decimal[] -> number[]
  volume: z.number().nullable(),
  liquidity: z.number().nullable(),
  endDate: z.any().nullable(),
  marketMakerAddress: z.string().nullable(),
  conditionId: z.string().nullable(),
  questionId: z.string().nullable(),
  tokens: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
  createdAt: z.any(),
  updatedAt: z.any(),
}).passthrough() // Allow additional fields

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

export const PredictionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)), // Accept both string and number IDs
  userMessage: z.string(),
  marketId: z.string(),
  predictionResult: z.any().nullable(), // More permissive for now
  modelName: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  aiResponse: z.string().nullable(),
  createdAt: z.any(), // More permissive for dates
  outcomes: z.array(z.string()).optional().default([]), // Default to empty array
  outcomesProbabilities: z.array(z.union([z.number(), z.any()])).optional().default([]), // Accept both numbers and any (for Decimal)
  userId: z.string().nullable(),
  experimentTag: z.string().nullable(),
  experimentNotes: z.string().nullable(),
}).passthrough() // Allow any additional fields

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
  aiProbability: DecimalSchema.nullable(), // Decimal -> number
  marketProbability: DecimalSchema.nullable(), // Decimal -> number
  delta: DecimalSchema.nullable(), // Decimal -> number
  absDelta: DecimalSchema.nullable(), // Decimal -> number
  marketClosed: z.boolean().nullable(),
  createdAt: DateSchema,
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
 * Output types for client consumption
 */
export type EventOutput = z.infer<typeof EventSchema>
export type MarketOutput = z.infer<typeof MarketSchema>
export type MarketWithEventOutput = z.infer<typeof MarketWithEventSchema>
export type PredictionOutput = z.infer<typeof PredictionSchema>
export type PredictionWithMarketOutput = z.infer<typeof PredictionWithMarketSchema>
export type PredictionCheckOutput = z.infer<typeof PredictionCheckSchema>
