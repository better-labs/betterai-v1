/**
 * Zod input schemas for Events API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'
import { Category } from '@/lib/generated/prisma'

// Create Zod enum from Prisma Category enum
const CategoryZodEnum = z.enum([
  'ELECTIONS',
  'GEOPOLITICS', 
  'ECONOMY',
  'FINANCIAL_MARKETS',
  'CRYPTOCURRENCY',
  'SCIENCE_TECHNOLOGY',
  'BUSINESS',
  'SPORTS',
  'CULTURE_ENTERTAINMENT',
  'CLIMATE_ENVIRONMENT',
  'OTHER'
])

// List events with filtering and pagination
export const GetEventsInput = z.object({
  // Single event query
  id: z.string().optional(),
  
  // Filter by category
  category: CategoryZodEnum.optional(),
  
  // Search in title/description
  search: z.string().min(1).max(200).optional(),
  
  // Pagination
  limit: z.number().int().positive().max(100).optional().default(50),
  cursor: z.string().optional(),
  
  // Sorting options
  sort: z.enum(['volume', 'recent', 'ending', 'alphabetical']).optional().default('volume'),
  
  // Include markets in response
  includeMarkets: z.boolean().optional().default(false),
  
  // Status filtering (active events vs all)
  status: z.enum(['active', 'all']).optional().default('all'),
})

// Single event by ID
export const GetEventByIdInput = z.object({
  id: z.string().min(1, 'Event ID is required'),
  includeMarkets: z.boolean().optional().default(false),
})

// Search events (dedicated search endpoint if needed)
export const SearchEventsInput = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  limit: z.number().int().positive().max(100).optional().default(50),
  cursor: z.string().optional(),
  sort: z.enum(['volume', 'recent', 'relevance']).optional().default('relevance'),
  category: CategoryZodEnum.optional(),
  includeMarkets: z.boolean().optional().default(false),
})

// Get events by category
export const GetEventsByCategoryInput = z.object({
  category: CategoryZodEnum,
  limit: z.number().int().positive().max(100).optional().default(50),
  includeMarkets: z.boolean().optional().default(false),
  sort: z.enum(['volume', 'recent', 'ending']).optional().default('volume'),
})

// Get category statistics
export const GetCategoryStatsInput = z.object({
  // No input parameters needed - returns all category stats
})

// Admin only - Create event
export const CreateEventInput = z.object({
  id: z.string().optional(), // If not provided, will generate UUID
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  slug: z.string().optional(),
  icon: z.string().url('Icon must be a valid URL').optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  category: CategoryZodEnum.optional(),
  providerCategory: z.string().optional(),
  volume: z.number().nonnegative().optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  marketProvider: z.string().optional(),
  tags: z.any().optional(), // JSON field
})

// Admin only - Update event
export const UpdateEventInput = z.object({
  id: z.string().min(1, 'Event ID is required'),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  slug: z.string().optional(),
  icon: z.string().url('Icon must be a valid URL').optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  category: CategoryZodEnum.optional(),
  providerCategory: z.string().optional(),
  volume: z.number().nonnegative().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  marketProvider: z.string().optional(),
  tags: z.any().optional(), // JSON field
})

// Admin only - Delete event
export const DeleteEventInput = z.object({
  id: z.string().min(1, 'Event ID is required'),
})

// Export utility type for category conversion
export function convertZodCategoryToPrisma(zodCategory: z.infer<typeof CategoryZodEnum>): Category {
  return zodCategory as Category
}