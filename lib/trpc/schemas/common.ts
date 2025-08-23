import { z } from 'zod'

// Common response wrapper
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
  })

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Paginated response wrapper
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: itemsSchema,
      totalCount: z.number().int().min(0),
      page: z.number().int().positive(),
      totalPages: z.number().int().min(0),
      hasMore: z.boolean(),
    }),
    message: z.string().optional(),
  })

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  filters: z.record(z.unknown()).optional(),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Decimal transformation schema
export const decimalToNumberSchema = z
  .union([z.number(), z.string(), z.object({ toNumber: z.function() })])
  .transform((val) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return Number(val)
    if (val && typeof val === 'object' && 'toNumber' in val) {
      return Number(val.toNumber())
    }
    return Number(val)
  })
  .pipe(z.number())

// Array of decimals transformation
export const decimalArraySchema = z
  .array(z.union([z.number(), z.string(), z.object({ toNumber: z.function() })]))
  .transform((arr) =>
    arr.map((val) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') return Number(val)
      if (val && typeof val === 'object' && 'toNumber' in val) {
        return Number(val.toNumber())
      }
      return Number(val)
    })
  )
  .pipe(z.array(z.number()))

// ID validation schema
export const idSchema = z.string().min(1, 'ID is required')

// Optional ID schema
export const optionalIdSchema = z.string().min(1).optional()

// UUID schema (if using UUIDs)
export const uuidSchema = z.string().uuid()

// Error codes enum
export const errorCodeEnum = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN', 
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'INSUFFICIENT_CREDITS',
  'MARKET_CLOSED',
  'INVALID_INPUT',
  'SERVER_ERROR',
])

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: errorCodeEnum.optional(),
  details: z.unknown().optional(),
  timestamp: z.string(),
})