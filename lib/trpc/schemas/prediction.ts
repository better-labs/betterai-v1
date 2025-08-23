import { z } from 'zod'

// Confidence level enum
export const confidenceLevelEnum = z.enum(['High', 'Medium', 'Low'])

// Prediction result schema (matches existing PredictionResult type)
export const predictionResultSchema = z.object({
  prediction: z.string(),
  outcomes: z.array(z.string()),
  outcomesProbabilities: z.array(z.number().min(0).max(1)),
  reasoning: z.string(),
  confidence_level: confidenceLevelEnum,
})

// Base prediction schema matching Prisma model
export const predictionSchema = z.object({
  id: z.string(),
  userMessage: z.string(),
  marketId: z.string(),
  predictionResult: predictionResultSchema,
  modelName: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  aiResponse: z.string().nullable(),
  createdAt: z.string(),
  outcomes: z.array(z.string()),
  outcomesProbabilities: z.array(z.number()),
  userId: z.string().nullable(),
  experimentTag: z.string().nullable(),
  experimentNotes: z.string().nullable(),
})

// Input schemas
export const predictionCreateSchema = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  userMessage: z.string().min(1, 'User message is required').max(2000),
  model: z.string().optional(),
  dataSources: z.array(z.string()).optional(),
  experimentTag: z.string().optional(),
  experimentNotes: z.string().optional(),
})

export const predictionSearchSchema = z.object({
  userId: z.string().optional(),
  marketId: z.string().optional(),
  modelName: z.string().optional(),
  experimentTag: z.string().optional(),
  confidenceLevel: confidenceLevelEnum.optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'confidence']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Prediction with market context
export const predictionWithMarketSchema = predictionSchema.extend({
  market: z.object({
    id: z.string(),
    question: z.string(),
    outcomes: z.array(z.string()),
    active: z.boolean().nullable(),
  }).optional(),
})

// Prediction check schema
export const predictionCheckSchema = z.object({
  id: z.string(),
  predictionId: z.string().nullable(),
  marketId: z.string().nullable(),
  aiProbability: z.number().nullable(),
  marketProbability: z.number().nullable(),
  delta: z.number().nullable(),
  absDelta: z.number().nullable(),
  marketClosed: z.boolean().nullable(),
  createdAt: z.string(),
})

// Response schemas
export const predictionCreateResponseSchema = z.object({
  success: z.boolean(),
  data: predictionSchema.nullable(),
  message: z.string().optional(),
  creditsRemaining: z.number().optional(),
})

export const predictionListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    predictions: z.array(predictionWithMarketSchema),
    totalCount: z.number(),
    page: z.number(),
    totalPages: z.number(),
  }),
  message: z.string().optional(),
})

export const predictionCheckResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(predictionCheckSchema),
  message: z.string().optional(),
})