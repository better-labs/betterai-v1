import { z } from 'zod'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * Transform schemas to handle Prisma-specific data types and conversions
 * These are critical for proper serialization between server and client
 */

// Prisma Decimal transformation with error handling
export const prismaDecimalTransform = z
  .union([
    z.number(),
    z.string(),
    z.instanceof(Decimal as any), // Type assertion for Decimal
    z.object({ 
      toNumber: z.function().returns(z.number()),
      toString: z.function().returns(z.string())
    })
  ])
  .transform((val, ctx) => {
    try {
      if (typeof val === 'number') {
        return val
      }
      
      if (typeof val === 'string') {
        const parsed = Number(val)
        if (isNaN(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid decimal string: ${val}`
          })
          return z.NEVER
        }
        return parsed
      }
      
      // Handle Prisma Decimal objects
      if (val && typeof val === 'object') {
        if ('toNumber' in val && typeof val.toNumber === 'function') {
          const result = val.toNumber()
          if (typeof result === 'number' && !isNaN(result)) {
            return result
          }
        }
        
        if ('toString' in val && typeof val.toString === 'function') {
          const stringVal = val.toString()
          const parsed = Number(stringVal)
          if (!isNaN(parsed)) {
            return parsed
          }
        }
      }
      
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Cannot convert value to number: ${JSON.stringify(val)}`
      })
      return z.NEVER
      
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Error converting decimal: ${error}`
      })
      return z.NEVER
    }
  })
  .pipe(z.number())

// Array of Prisma Decimals transformation
export const prismaDecimalArrayTransform = z
  .array(z.union([
    z.number(),
    z.string(), 
    z.instanceof(Decimal as any),
    z.object({
      toNumber: z.function().returns(z.number()),
      toString: z.function().returns(z.string())
    })
  ]))
  .transform((arr, ctx) => {
    const result: number[] = []
    
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i]
      
      try {
        if (typeof val === 'number') {
          result.push(val)
          continue
        }
        
        if (typeof val === 'string') {
          const parsed = Number(val)
          if (isNaN(parsed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid decimal string at index ${i}: ${val}`,
              path: [i]
            })
            return z.NEVER
          }
          result.push(parsed)
          continue
        }
        
        // Handle Prisma Decimal objects
        if (val && typeof val === 'object') {
          if ('toNumber' in val && typeof val.toNumber === 'function') {
            const numResult = val.toNumber()
            if (typeof numResult === 'number' && !isNaN(numResult)) {
              result.push(numResult)
              continue
            }
          }
          
          if ('toString' in val && typeof val.toString === 'function') {
            const stringVal = val.toString()
            const parsed = Number(stringVal)
            if (!isNaN(parsed)) {
              result.push(parsed)
              continue
            }
          }
        }
        
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cannot convert array value to number at index ${i}: ${JSON.stringify(val)}`,
          path: [i]
        })
        return z.NEVER
        
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Error converting decimal at index ${i}: ${error}`,
          path: [i]
        })
        return z.NEVER
      }
    }
    
    return result
  })
  .pipe(z.array(z.number()))

// Date transformation (ISO string to Date and back)
export const dateTransform = z
  .union([z.date(), z.string().datetime(), z.null()])
  .transform((val) => {
    if (val === null) return null
    if (val instanceof Date) return val.toISOString()
    if (typeof val === 'string') return val
    return new Date(val).toISOString()
  })
  .pipe(z.string().nullable())

// JSON field transformation with validation
export const jsonFieldTransform = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([z.string(), schema, z.null()])
    .transform((val, ctx) => {
      if (val === null) return null
      
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val)
          return parsed
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid JSON string: ${error}`
          })
          return z.NEVER
        }
      }
      
      return val
    })
    .pipe(schema.nullable())

// Tags transformation (handles JSON tags field)
export const tagsTransform = jsonFieldTransform(
  z.array(z.object({
    id: z.string(),
    label: z.string(),
    slug: z.string(),
    forceShow: z.boolean().optional(),
    updatedAt: z.string().optional(),
  }))
)

// Outcome prices transformation (handles Decimal[] to number[])
export const outcomePricesTransform = z
  .union([
    z.array(z.number()),
    z.array(z.string()),
    prismaDecimalArrayTransform,
    z.string() // JSON string
  ])
  .transform((val, ctx) => {
    if (Array.isArray(val)) {
      return val.map(v => {
        if (typeof v === 'number') return v
        if (typeof v === 'string') return Number(v)
        if (v && typeof v === 'object' && 'toNumber' in v) {
          return Number(v.toNumber())
        }
        return Number(v)
      })
    }
    
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) {
          return parsed.map(v => Number(v))
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid outcome prices JSON: ${error}`
        })
        return z.NEVER
      }
    }
    
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Outcome prices must be an array or JSON string'
    })
    return z.NEVER
  })
  .pipe(z.array(z.number()))

// Outcomes transformation (handles string[] or JSON string)
export const outcomesTransform = z
  .union([
    z.array(z.string()),
    z.string() // JSON string
  ])
  .transform((val, ctx) => {
    if (Array.isArray(val)) {
      return val
    }
    
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) {
          return parsed.map(String)
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid outcomes JSON: ${error}`
        })
        return z.NEVER
      }
    }
    
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Outcomes must be an array or JSON string'
    })
    return z.NEVER
  })
  .pipe(z.array(z.string()))

// Market transformation schema (combines all market-specific transforms)
export const marketDataTransform = z.object({
  id: z.string(),
  question: z.string(),
  eventId: z.string(),
  outcomePrices: outcomePricesTransform,
  outcomes: outcomesTransform,
  volume: prismaDecimalTransform.nullable(),
  liquidity: prismaDecimalTransform.nullable(),
  description: z.string().nullable(),
  active: z.boolean().nullable(),
  closed: z.boolean().nullable(),
  endDate: dateTransform,
  startDate: dateTransform,
  updatedAt: dateTransform,
  slug: z.string().nullable(),
  resolutionSource: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
})

// Event transformation schema
export const eventDataTransform = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string().nullable(),
  icon: z.string().nullable(),
  tags: tagsTransform,
  volume: prismaDecimalTransform.nullable(),
  endDate: dateTransform,
  startDate: dateTransform,
  updatedAt: dateTransform,
  marketProvider: z.string().nullable(),
  image: z.string().nullable(),
  category: z.string().nullable(),
  providerCategory: z.string().nullable(),
})

// Prediction transformation schema
export const predictionDataTransform = z.object({
  id: z.string(),
  userMessage: z.string(),
  marketId: z.string(),
  predictionResult: z.unknown(), // JSON field
  modelName: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  aiResponse: z.string().nullable(),
  createdAt: dateTransform,
  outcomes: outcomesTransform,
  outcomesProbabilities: prismaDecimalArrayTransform,
  userId: z.string().nullable(),
  experimentTag: z.string().nullable(),
  experimentNotes: z.string().nullable(),
})