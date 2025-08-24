import type { PrismaClient } from '@/lib/generated/prisma'

/**
 * Database client type that supports both full PrismaClient and transaction clients
 * This type alias simplifies service function signatures
 */
export type DbClient = PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>

/**
 * Database client that supports transactions (full PrismaClient only)
 * Used for operations that require $transaction access
 */
export type DbClientWithTransaction = PrismaClient