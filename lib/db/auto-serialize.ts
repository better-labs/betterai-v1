/**
 * Auto-serialization utilities to eliminate manual serialization
 * Provides a safer, more maintainable approach for large applications
 */

import { serializeDecimals, type SerializeDecimals } from '@/lib/serialization'

/**
 * Higher-order function that automatically serializes any query result
 * Eliminates the need for manual *Serialized query variants
 */
export function withAutoSerialization<T extends (...args: any[]) => Promise<any>>(
  queryFn: T
): (...args: Parameters<T>) => Promise<SerializeDecimals<Awaited<ReturnType<T>>>> {
  return async (...args) => {
    const result = await queryFn(...args)
    return serializeDecimals(result)
  }
}

/**
 * Batch auto-serialization for multiple queries
 * Useful for Promise.all scenarios
 */
export function withBatchSerialization<T extends Record<string, (...args: any[]) => Promise<any>>>(
  queries: T
): {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<SerializeDecimals<Awaited<ReturnType<T[K]>>>>
} {
  const serializedQueries = {} as any
  
  for (const [key, queryFn] of Object.entries(queries)) {
    serializedQueries[key] = withAutoSerialization(queryFn)
  }
  
  return serializedQueries
}

/**
 * Decorator for query objects to auto-serialize all methods
 * Perfect for existing query modules
 */
export function autoSerializeQueries<T extends Record<string, any>>(queryObject: T): T & {
  __serialized: {
    [K in keyof T]: T[K] extends (...args: any[]) => Promise<any>
      ? (...args: Parameters<T[K]>) => Promise<SerializeDecimals<Awaited<ReturnType<T[K]>>>>
      : T[K]
  }
} {
  const serialized = {} as any
  
  for (const [key, value] of Object.entries(queryObject)) {
    if (typeof value === 'function' && value.constructor.name === 'AsyncFunction') {
      serialized[key] = withAutoSerialization(value)
    } else {
      serialized[key] = value
    }
  }
  
  return {
    ...queryObject,
    __serialized: serialized
  }
}

/**
 * Type guard to ensure data is serialized before passing to client components
 */
export function ensureSerialized<T>(
  data: T,
  source: string = 'unknown'
): SerializeDecimals<T> {
  if (process.env.NODE_ENV === 'development') {
    const { validateNoDecimals } = require('@/lib/serialization')
    try {
      validateNoDecimals(data, source)
    } catch (error) {
      console.error(`❌ Unserialized data detected in ${source}:`, error)
      // Auto-serialize in development to prevent crashes
      return serializeDecimals(data)
    }
  }
  
  return data as SerializeDecimals<T>
}

/**
 * Example usage:
 * 
 * // Option 1: Wrap individual functions
 * const getMarketSafe = withAutoSerialization(marketQueries.getMarketById)
 * 
 * // Option 2: Batch multiple queries  
 * const safeQueries = withBatchSerialization({
 *   getMarket: marketQueries.getMarketById,
 *   getPrediction: predictionQueries.getPredictionById
 * })
 * 
 * // Option 3: Auto-serialize entire query object
 * const safeMarketQueries = autoSerializeQueries(marketQueries)
 * const market = await safeMarketQueries.__serialized.getMarketById('123')
 * 
 * // Option 4: Type guard for existing serialized functions
 * const data = ensureSerialized(await someQuery(), 'PredictionPage')
 */
