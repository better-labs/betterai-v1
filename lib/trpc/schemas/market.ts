import { z } from 'zod'

/**
 * Market input schemas for tRPC procedures
 * Following Phase 2 guidance: Input validation only, no .output() schemas
 * Response types are inferred from service returns
 */

export const GetMarketsInput = z.object({
  id: z.string().optional(),
  eventId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  cursor: z.string().optional(),
  sort: z.enum(['trending', 'liquidity', 'volume', 'newest', 'ending', 'competitive']).optional().default('trending'),
  status: z.enum(['active', 'resolved', 'all']).optional().default('all'),
})

export const GetMarketByIdInput = z.object({
  id: z.string().min(1, 'Market ID is required'),
})


export const CreateMarketInput = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  description: z.string().optional(),
  eventId: z.string().min(1, 'Event ID is required'),
  outcomes: z.array(z.string().min(1)).min(2, 'At least 2 outcomes required'),
  outcomePrices: z.array(z.number().min(0).max(1)).optional(),
  volume: z.number().nonnegative().optional(),
  liquidity: z.number().nonnegative().optional(),
  active: z.boolean().optional().default(true),
  closed: z.boolean().optional().default(false),
  endDate: z.date().optional(),
  image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
})

export const UpdateMarketInput = z.object({
  id: z.string().min(1, 'Market ID is required'),
  question: z.string().min(10).optional(),
  description: z.string().optional(),
  outcomes: z.array(z.string().min(1)).min(2).optional(),
  outcomePrices: z.array(z.number().min(0).max(1)).optional(),
  volume: z.number().nonnegative().optional(),
  liquidity: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  endDate: z.date().optional(),
  image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
})

export const DeleteMarketInput = z.object({
  id: z.string().min(1, 'Market ID is required'),
})

export const GetTrendingMarketsInput = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  cursor: z.string().optional(),
  withPredictions: z.boolean().optional().default(false),
})