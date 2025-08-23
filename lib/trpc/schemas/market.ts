import { z } from 'zod'
import { decimalToNumberSchema, decimalArraySchema, paginatedResponseSchema, apiResponseSchema } from './common'

// Input schemas
export const marketSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'volume', 'liquidity']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const marketCreateSchema = z.object({
  question: z.string().min(1).max(1000),
  eventId: z.string().min(1),
  description: z.string().optional(),
  outcomes: z.array(z.string()).min(2).max(10),
  outcomePrices: z.array(z.number().min(0).max(1)),
  volume: z.number().optional(),
  liquidity: z.number().optional(),
  active: z.boolean().optional().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  resolutionSource: z.string().optional(),
})

export const marketUpdateSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(1000).optional(),
  description: z.string().optional(),
  outcomes: z.array(z.string()).min(2).max(10).optional(),
  outcomePrices: z.array(z.number().min(0).max(1)).optional(),
  volume: z.number().optional(),
  liquidity: z.number().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  resolutionSource: z.string().optional(),
})

export const marketDeleteSchema = z.object({
  id: z.string().min(1),
})

// Output schemas with Decimal transformation
export const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  eventId: z.string(),
  outcomePrices: decimalArraySchema,
  volume: decimalToNumberSchema.nullable(),
  liquidity: decimalToNumberSchema.nullable(),
  description: z.string().nullable(),
  active: z.boolean().nullable(),
  closed: z.boolean().nullable(),
  endDate: z.string().nullable(),
  updatedAt: z.string().nullable(),
  slug: z.string().nullable(),
  startDate: z.string().nullable(),
  resolutionSource: z.string().nullable(),
  outcomes: z.array(z.string()),
  icon: z.string().nullable(),
  image: z.string().nullable(),
})

// Response schemas using common patterns
export const marketListResponseSchema = paginatedResponseSchema(z.array(marketSchema))

export const marketCreateResponseSchema = apiResponseSchema(marketSchema)

export const marketUpdateResponseSchema = apiResponseSchema(marketSchema)

export const marketDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const marketTrendingResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(marketSchema),
  message: z.string().optional(),
})