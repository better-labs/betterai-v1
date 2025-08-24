import { prisma } from "../prisma"
import { Prisma } from '../../../lib/generated/prisma'
import type { PredictionCheck } from '../../../lib/generated/prisma';
import { serializeDecimals } from "@/lib/serialization"
import type { PredictionCheckDTO } from "@/lib/types"
import { toNumberOrNull } from "@/lib/utils"

// Prediction Check queries
export const predictionCheckQueries = {
  create: async (data: {
    predictionId?: number | null
    marketId?: string | null
    aiProbability?: number | Prisma.Decimal | null
    marketProbability?: number | Prisma.Decimal | null
    delta?: number | Prisma.Decimal | null
    absDelta?: number | Prisma.Decimal | null
    marketClosed?: boolean | null
  }): Promise<PredictionCheck> => {
    // Normalize to Prisma.Decimal where provided
    const toDecimal = (v: number | Prisma.Decimal | null | undefined): Prisma.Decimal | null => {
      if (v === null || v === undefined) return null
      return typeof v === 'number' ? new Prisma.Decimal(v) : v
    }

    return await prisma.predictionCheck.create({
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
  },
  getRecentByMarket: async (marketId: string, limit = 50): Promise<PredictionCheck[]> => {
    return await prisma.predictionCheck.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
  getRecentByMarketSerialized: async (marketId: string, limit = 50): Promise<PredictionCheckDTO[]> => {
    const checks = await prisma.predictionCheck.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    const s = serializeDecimals(checks) as Array<Record<string, unknown>>
    return s.map((c) => ({
      id: String(c.id),
      predictionId: c.predictionId == null ? null : String(c.predictionId),
      marketId: (c.marketId as string) ?? null,
      aiProbability: toNumberOrNull(c.aiProbability),
      marketProbability: toNumberOrNull(c.marketProbability),
      delta: toNumberOrNull(c.delta),
      absDelta: toNumberOrNull(c.absDelta),
      marketClosed: (c.marketClosed as boolean) ?? null,
      createdAt: typeof c.createdAt === 'string' ? (c.createdAt as string) : new Date(c.createdAt as any).toISOString(),
    }))
  },
}