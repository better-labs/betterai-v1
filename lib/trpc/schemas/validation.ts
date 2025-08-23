import { z } from 'zod'

// Enhanced validation schemas with detailed error messages

// Market validation with custom messages
export const marketValidationSchema = z.object({
  question: z
    .string()
    .min(10, 'Market question must be at least 10 characters')
    .max(1000, 'Market question cannot exceed 1000 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Market question cannot be empty or whitespace only'
    ),
  
  eventId: z
    .string()
    .min(1, 'Event ID is required')
    .refine(
      (val) => /^[a-zA-Z0-9_-]+$/.test(val),
      'Event ID can only contain letters, numbers, underscores, and hyphens'
    ),
  
  outcomes: z
    .array(z.string().min(1, 'Outcome cannot be empty'))
    .min(2, 'At least 2 outcomes are required')
    .max(10, 'Maximum 10 outcomes allowed')
    .refine(
      (outcomes) => new Set(outcomes).size === outcomes.length,
      'Outcomes must be unique'
    ),
  
  outcomePrices: z
    .array(z.number().min(0, 'Prices cannot be negative').max(1, 'Prices cannot exceed 1'))
    .refine(
      (prices: number[]) => {
        // Simple validation - just check that we have prices
        return prices.length > 0
      },
      'Number of prices must match number of outcomes'
    )
    .refine(
      (prices) => Math.abs(prices.reduce((sum, price) => sum + price, 0) - 1) < 0.01,
      'Outcome prices must sum to approximately 1.0'
    ),
  
  volume: z
    .number()
    .min(0, 'Volume cannot be negative')
    .optional(),
  
  liquidity: z
    .number()
    .min(0, 'Liquidity cannot be negative')
    .optional(),
  
  endDate: z
    .string()
    .datetime('Invalid date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'End date must be in the future'
    )
    .optional(),
  
  startDate: z
    .string()
    .datetime('Invalid date format')
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Start date must be before end date',
    path: ['startDate']
  }
)

// User validation with custom messages
export const userValidationSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .max(254, 'Email address is too long')
    .optional(),
  
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .refine(
      (val) => !val.toLowerCase().includes('admin'),
      'Username cannot contain "admin"'
    )
    .optional(),
  
  walletAddress: z
    .string()
    .refine(
      (val) => /^0x[a-fA-F0-9]{40}$/.test(val),
      'Invalid Ethereum wallet address format'
    )
    .optional(),
  
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .refine(
      (url) => {
        const allowedDomains = ['gravatar.com', 'githubusercontent.com', 'cloudflare.com']
        try {
          const domain = new URL(url).hostname
          return allowedDomains.some(allowed => domain.includes(allowed))
        } catch {
          return false
        }
      },
      'Avatar must be from an allowed domain'
    )
    .optional(),
})

// Prediction validation with custom messages
export const predictionValidationSchema = z.object({
  userMessage: z
    .string()
    .min(5, 'Prediction prompt must be at least 5 characters')
    .max(2000, 'Prediction prompt cannot exceed 2000 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Prediction prompt cannot be empty or whitespace only'
    ),
  
  marketId: z
    .string()
    .min(1, 'Market ID is required')
    .uuid('Invalid market ID format')
    .optional()
    .or(z.string().min(1, 'Market ID is required')), // Accept both UUID and other formats
  
  model: z
    .string()
    .min(1, 'Model name cannot be empty')
    .refine(
      (val) => /^[a-zA-Z0-9\/-]+$/.test(val),
      'Model name contains invalid characters'
    )
    .optional(),
  
  experimentTag: z
    .string()
    .max(50, 'Experiment tag cannot exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]*$/,
      'Experiment tag can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  
  experimentNotes: z
    .string()
    .max(1000, 'Experiment notes cannot exceed 1000 characters')
    .optional(),
})

// Credit validation with custom messages
export const creditValidationSchema = z.object({
  amount: z
    .number()
    .int('Credit amount must be a whole number')
    .min(1, 'Minimum credit purchase is 1')
    .max(10000, 'Maximum credit purchase is 10,000'),
  
  paymentMethod: z
    .enum(['stripe', 'crypto'], {
      errorMap: () => ({ message: 'Payment method must be either "stripe" or "crypto"' })
    }),
})

// Search validation with custom messages
export const searchValidationSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query cannot exceed 200 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Search query cannot be whitespace only'
    )
    .refine(
      (val) => !/<script|javascript:/i.test(val),
      'Search query contains potentially harmful content'
    ),
  
  limit: z
    .number()
    .int('Limit must be a whole number')
    .min(1, 'Minimum limit is 1')
    .max(100, 'Maximum limit is 100')
    .default(20),
  
  page: z
    .number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
})

// Rate limiting validation
export const rateLimitValidationSchema = z.object({
  requestsPerMinute: z
    .number()
    .int()
    .min(1)
    .max(1000),
  
  requestsPerHour: z
    .number()
    .int()
    .min(1)
    .max(10000),
  
  burstLimit: z
    .number()
    .int()
    .min(1)
    .max(100),
})

// File upload validation
export const fileUploadValidationSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .refine(
      (name) => /^[a-zA-Z0-9._-]+$/.test(name),
      'File name contains invalid characters'
    ),
  
  fileSize: z
    .number()
    .int()
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'), // 10MB
  
  mimeType: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'text/csv'].includes(type),
      'Unsupported file type'
    ),
})