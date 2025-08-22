/**
 * Comprehensive serialization utilities for Next.js Server/Client Components
 * Handles Prisma Decimals, Dates, and other non-serializable objects
 */

// Check if an object is a Prisma Decimal by looking at its constructor and methods
function isPrismaDecimal(obj: any): boolean {
  return obj != null && 
         typeof obj === 'object' && 
         obj.constructor && 
         obj.constructor.name === 'Decimal' && 
         typeof obj.toString === 'function' &&
         typeof obj.toNumber === 'function'
}

// Type to recursively convert Decimals to numbers in type definitions
export type SerializeDecimals<T> = T extends any[] 
  ? SerializeDecimals<T[number]>[]
  : T extends Date
  ? string
  : T extends { constructor: { name: 'Decimal' } }
  ? number
  : T extends object
  ? { [K in keyof T]: SerializeDecimals<T[K]> }
  : T

/**
 * Convert Prisma Decimal objects to numbers recursively
 * Handles nested objects, arrays, and edge cases
 */
export function serializeDecimals<T>(obj: T): SerializeDecimals<T> {
  if (obj === null || obj === undefined) return obj as SerializeDecimals<T>

  // Handle Prisma Decimal objects (check without importing Decimal class)
  if (isPrismaDecimal(obj)) {
    return Number(obj.toString()) as SerializeDecimals<T>
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimals) as SerializeDecimals<T>
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as SerializeDecimals<T>
  }

  // Handle plain objects (be more inclusive of object types)
  if (typeof obj === 'object' && obj !== null) {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDecimals(value)
    }
    return serialized as SerializeDecimals<T>
  }

  return obj as SerializeDecimals<T>
}

/**
 * Validates that an object contains no Decimal instances
 * Useful for runtime checks before passing data to Client Components
 */
export function validateNoDecimals(obj: any, path = 'root'): void {
  if (obj === null || obj === undefined) return

  if (isPrismaDecimal(obj)) {
    throw new Error(`Found unserialized Decimal at ${path}. Use serializeDecimals() before passing to Client Components.`)
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => validateNoDecimals(item, `${path}[${index}]`))
    return
  }

  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => 
      validateNoDecimals(value, `${path}.${key}`)
    )
  }
}

/**
 * Higher-order function to automatically serialize server component props
 */
export function withSerialization<T extends Record<string, any>>(props: T): SerializeDecimals<T> {
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