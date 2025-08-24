/**
 * Comprehensive serialization utilities for Next.js Server/Client Components
 * Handles Prisma Decimals, Dates, and other non-serializable objects
 */

// Check if an object is a Prisma Decimal by looking at its methods and properties
// This is more robust than checking constructor.name which gets mangled in production
function isPrismaDecimal(obj: any): boolean {
  return obj != null && 
         typeof obj === 'object' && 
         // Check for the specific combination of methods that Prisma Decimal has
         typeof obj.toString === 'function' &&
         typeof obj.toNumber === 'function' &&
         typeof obj.toFixed === 'function' &&
         typeof obj.valueOf === 'function' &&
         // Prisma Decimals have a 'd' property that contains the actual decimal data
         obj.d != null &&
         Array.isArray(obj.d)
}

/**
 * Convert Prisma Decimal objects to numbers recursively
 * Handles nested objects, arrays, and edge cases
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  // Handle Prisma Decimal objects (check without importing Decimal class)
  if (isPrismaDecimal(obj)) {
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