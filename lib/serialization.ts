/**
 * Comprehensive serialization utilities for Next.js Server/Client Components
 * Handles Prisma Decimals, Dates, and other non-serializable objects
 */

import { Decimal } from '@prisma/client/runtime/library'

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
  return predictions.map(p => ({
    ...p,
    id: p.id?.toString(),
    outcomesProbabilities: p.outcomesProbabilities?.map((prob: any) => 
      prob instanceof Decimal ? Number(prob.toString()) : prob
    ),
    // Add other specific field transformations as needed
  }))
}

/**
 * Serializer for prediction checks
 */
export function serializePredictionChecks(checks: any[]) {
  return checks.map(c => ({
    ...c,
    aiProbability: c.aiProbability instanceof Decimal ? Number(c.aiProbability.toString()) : c.aiProbability,
    marketProbability: c.marketProbability instanceof Decimal ? Number(c.marketProbability.toString()) : c.marketProbability,
    delta: (c.absDelta || c.delta) instanceof Decimal ? Number((c.absDelta || c.delta).toString()) : (c.absDelta || c.delta),
  }))
}