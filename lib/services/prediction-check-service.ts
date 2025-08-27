import type { PrismaClient, PredictionCheck } from '@/lib/generated/prisma'
import { Prisma } from '@/lib/generated/prisma'
import { mapPredictionChecksToDTO } from '@/lib/dtos/prediction-check-dto'
import type { PredictionCheckDTO } from '@/lib/types'

/**
 * Prediction Check service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs for responses
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function createPredictionCheck(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  data: {
    predictionId?: number | null
    marketId?: string | null
    aiProbability?: number | Prisma.Decimal | null
    marketProbability?: number | Prisma.Decimal | null
    delta?: number | Prisma.Decimal | null
    absDelta?: number | Prisma.Decimal | null
    marketClosed?: boolean | null
  }
): Promise<PredictionCheck> {
  // Normalize to Prisma.Decimal where provided
  const toDecimal = (v: number | Prisma.Decimal | null | undefined): Prisma.Decimal | null => {
    if (v === null || v === undefined) return null
    return typeof v === 'number' ? new Prisma.Decimal(v) : v
  }

  return await db.predictionCheck.create({
    data: {
      predictionId: data.predictionId ?? null,
      marketId: data.marketId ?? null,
      aiProbability: toDecimal(data.aiProbability),
      marketProbability: toDecimal(data.marketProbability),
      delta: toDecimal(data.delta),
      absDelta: toDecimal(data.absDelta),
      marketClosed: data.marketClosed ?? null,
    },
  })
}

export async function getRecentByMarket(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  limit = 50
): Promise<PredictionCheckDTO[]> {
  const checks = await db.predictionCheck.findMany({
    where: { marketId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return mapPredictionChecksToDTO(checks)
}

