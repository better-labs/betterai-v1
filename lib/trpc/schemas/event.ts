import { z } from 'zod'

// Enum for categories matching Prisma
export const categoryEnum = z.enum([
  'ELECTIONS', 'GEOPOLITICS', 'BUSINESS', 'SCIENCE', 'SPORTS', 'CRYPTO', 
  'ENTERTAINMENT', 'NEWS', 'CULTURE', 'FINANCE', 'HEALTH', 'TECHNOLOGY'
])

// Base event schema matching Prisma model
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string().nullable(),
  icon: z.string().nullable(),
  tags: z.unknown().nullable(), // JSON field
  volume: z.number().nullable(),
  endDate: z.string().nullable(),
  marketProvider: z.string().nullable(),
  updatedAt: z.string().nullable(),
  startDate: z.string().nullable(),
  image: z.string().nullable(),
  category: categoryEnum.nullable(),
  providerCategory: z.string().nullable(),
})

// Input schemas
export const eventSearchSchema = z.object({
  q: z.string().optional(),
  category: categoryEnum.optional(),
  provider: z.string().optional(),
  active: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['updatedAt', 'volume', 'endDate', 'startDate']).optional().default('volume'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const eventCreateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().url().optional(),
  tags: z.unknown().optional(), // JSON field
  volume: z.number().min(0).optional(),
  endDate: z.string().datetime().optional(),
  marketProvider: z.string().optional(),
  startDate: z.string().datetime().optional(),
  image: z.string().url().optional(),
  category: categoryEnum.optional(),
  providerCategory: z.string().optional(),
})

export const eventUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().url().optional(),
  tags: z.unknown().optional(),
  volume: z.number().min(0).optional(),
  endDate: z.string().datetime().optional(),
  marketProvider: z.string().optional(),
  startDate: z.string().datetime().optional(),
  image: z.string().url().optional(),
  category: categoryEnum.optional(),
  providerCategory: z.string().optional(),
})

export const eventDeleteSchema = z.object({
  id: z.string().min(1),
})

// Event with markets relation
export const eventWithMarketsSchema = eventSchema.extend({
  markets: z.array(z.object({
    id: z.string(),
    question: z.string(),
    volume: z.number().nullable(),
    active: z.boolean().nullable(),
  })).optional(),
})

// Response schemas
export const eventListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    events: z.array(eventSchema),
    totalCount: z.number(),
    page: z.number(),
    totalPages: z.number(),
  }),
  message: z.string().optional(),
})

export const eventDetailResponseSchema = z.object({
  success: z.boolean(),
  data: eventWithMarketsSchema.nullable(),
  message: z.string().optional(),
})