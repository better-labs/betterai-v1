/**
 * Type utilities to prevent raw Prisma data in client components
 */

import type { Decimal } from '@prisma/client/runtime/library'

// Utility type to detect Prisma Decimal objects
type HasDecimal<T> = T extends Decimal 
  ? true 
  : T extends object 
    ? { [K in keyof T]: HasDecimal<T[K]> }[keyof T] extends true 
      ? true 
      : false
    : false

// Utility type to ensure data is client-safe (no Decimals)
export type ClientSafe<T> = HasDecimal<T> extends true 
  ? never 
  : T

// Wrapper type for client component props
export type ClientComponentProps<T> = {
  [K in keyof T]: ClientSafe<T[K]>
}

// Helper type for serialized data
export type Serialized<T> = T extends Decimal
  ? number
  : T extends Date
    ? string
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T

// Branded type to mark data as properly serialized
export type SerializedData<T> = Serialized<T> & { __serialized: true }

/**
 * Example usage in components:
 * 
 * // ❌ This would cause a TypeScript error:
 * interface BadProps {
 *   market: Market // Raw Prisma type with Decimals
 * }
 * 
 * // ✅ This enforces serialized data:
 * interface GoodProps {
 *   market: ClientSafe<MarketDTO> // Only allows serialized types
 * }
 * 
 * // ✅ Or use the wrapper:
 * interface ComponentProps extends ClientComponentProps<{
 *   market: MarketDTO
 *   prediction: PredictionDTO
 * }> {}
 */