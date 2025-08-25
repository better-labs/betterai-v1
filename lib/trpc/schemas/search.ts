/**
 * Zod input schemas for Search API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// Search all content types
export const SearchAllInput = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  limit: z.number().int().positive().max(50).optional().default(10),
  includeMarkets: z.boolean().optional().default(true),
  includeEvents: z.boolean().optional().default(true),
  includeTags: z.boolean().optional().default(true),
  // Market-specific search options
  marketSort: z.enum(['trending', 'liquidity', 'volume', 'newest', 'ending', 'competitive']).optional(),
  marketStatus: z.enum(['active', 'resolved', 'all']).optional(),
})