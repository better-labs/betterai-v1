/**
 * Comprehensive serialization utilities for Next.js Server/Client Components
 * Handles Prisma Decimals, Dates, and other non-serializable objects
 */

// Dynamic import to avoid Prisma client during build
let Decimal: any

// Check if we're in build mode or if Prisma is available
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL
const isPrismaAvailable = (() => {
  try {
    require.resolve('@prisma/client/runtime/library')
    return true
  } catch {
    return false
  }
})()

if (!isBuildTime && isPrismaAvailable) {
  Decimal = require('@prisma/client/runtime/library').Decimal
} else {
  // Fallback for build time when Prisma isn't available
  Decimal = class {
    constructor(value: any) {
      return value
    }
    toString() {
      return String(this)
    }
  }
}

/**
 * Convert Prisma Decimal objects to numbers recursively
 * Handles nested objects, arrays, and edge cases
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  // Handle Prisma Decimal objects
  if (obj instanceof Decimal) {
    return Number(obj.toString()) as T
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimals) as T
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as T
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDecimals(value)
    }
    return serialized
  }

  return obj
}

/**
 * Higher-order function to automatically serialize server component props
 */
export function withSerialization<T extends Record<string, any>>(props: T): T {
  return serializeDecimals(props)
}

/**
 * Type-safe serializer for specific data shapes
 */
export function serializePredictionData(predictions: any[]) {
  return serializeDecimals(predictions.map(p => ({
    ...p,
    id: p.id?.toString(),
    marketOutcomePrices: p.market?.outcomePrices || null,
  })))
}

/**
 * Serializer for prediction checks
 */
export function serializePredictionChecks(checks: any[]) {
  return serializeDecimals(checks)
}