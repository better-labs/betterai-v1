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
 * Event schemas
 */
export const EventSchema = z.object({
  id: IdSchema,
  title: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  icon: z.string().nullable(),
  slug: z.string(),
  active: z.boolean(),
  hidden: z.boolean().nullable(),
  volume: DecimalSchema.nullable(),
  endDate: DateSchema.nullable(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
})

/**
 * Market schemas
 */
export const MarketSchema = z.object({
  id: IdSchema,
  eventId: IdSchema,
  question: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  icon: z.string().nullable(),
  outcomes: z.array(z.string()),
  outcomePrices: z.array(DecimalSchema), // Decimal[] -> number[]
  volume: DecimalSchema.nullable(),
  liquidity: DecimalSchema.nullable(),
  endDate: DateSchema.nullable(),
  marketMakerAddress: z.string().nullable(),
  conditionId: z.string().nullable(),
  questionId: z.string().nullable(),
  tokens: z.array(z.string()),
  active: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
})

export const MarketWithEventSchema = MarketSchema.extend({
  event: EventSchema.nullable(),
})

/**
 * Prediction schemas
 */
export const PredictionResultSchema = z.object({
  predicted_outcome: z.string(),
  confidence_level: z.string(),
  confidence_score: z.number(),
  reasoning: z.string(),
  market_analysis: z.string().optional(),
  key_factors: z.array(z.string()).optional(),
  outcome_probabilities: z.record(z.string(), z.number()).optional(),
})

export const PredictionSchema = z.object({
  id: z.number().transform(String), // Convert number ID to string for consistency
  userMessage: z.string(),
  marketId: IdSchema,
  predictionResult: PredictionResultSchema.nullable(),
  modelName: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  aiResponse: z.string().nullable(),
  createdAt: DateSchema,
  outcomes: z.array(z.string()),
  outcomesProbabilities: z.array(DecimalSchema), // Decimal[] -> number[]
  userId: z.string().nullable(),
  experimentTag: z.string().nullable(),
  experimentNotes: z.string().nullable(),
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
