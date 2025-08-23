import { PrismaClient, Prisma } from '@/lib/generated/prisma'
import { serializeDecimals } from '@/lib/serialization'
import type { MarketDTO } from '@/lib/types'

// Type for Prisma client or transaction
type PrismaContext = PrismaClient | Prisma.TransactionClient

/**
 * Search markets with filters and pagination
 */
export async function searchMarkets(
  db: PrismaContext,
  params: {
    q?: string
    limit?: number
    active?: boolean
    sortBy?: 'volume' | 'liquidity' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<MarketDTO[]> {
  const {
    q = '',
    limit = 20,
    active,
    sortBy = 'volume',
    sortOrder = 'desc'
  } = params

  const where: Prisma.MarketWhereInput = {
    OR: q ? [
      { question: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      {
        event: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      },
    ] : undefined,
    ...(active !== undefined && { active }),
  }

  const orderBy: Prisma.MarketOrderByWithRelationInput = {
    [sortBy]: sortOrder
  }

  const markets = await db.market.findMany({
    where,
    orderBy,
    take: Math.min(limit, 100), // Cap at 100
    include: {
      event: true,
      predictions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return markets.map(toMarketDTO)
}

/**
 * Get single market by ID
 */
export async function getMarketById(
  db: PrismaContext,
  id: string
): Promise<MarketDTO | null> {
  const market = await db.market.findUnique({
    where: { id },
    include: {
      event: true,
      predictions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return market ? toMarketDTO(market) : null
}

/**
 * Get trending markets (high volume, active)
 */
export async function getTrendingMarkets(
  db: PrismaContext,
  limit: number = 10
): Promise<MarketDTO[]> {
  const markets = await db.market.findMany({
    where: {
      active: true,
      volume: { gt: 1000 }, // Only markets with volume > 1000
    },
    orderBy: { volume: 'desc' },
    take: Math.min(limit, 50),
  })

  return markets.map(toMarketDTO)
}

/**
 * Create a new market
 */
export async function createMarket(
  db: PrismaContext,
  data: {
    id?: string
    question: string
    eventId: string
    outcomes: string[]
    outcomePrices: number[]
    description?: string
    volume?: number
    liquidity?: number
    active?: boolean
    startDate?: string
    endDate?: string
    resolutionSource?: string
  }
): Promise<MarketDTO> {
  const marketData = {
    id: data.id || crypto.randomUUID(),
    question: data.question,
    eventId: data.eventId,
    outcomes: data.outcomes,
    outcomePrices: data.outcomePrices.map(p => new Prisma.Decimal(p)),
    description: data.description,
    volume: data.volume ? new Prisma.Decimal(data.volume) : null,
    liquidity: data.liquidity ? new Prisma.Decimal(data.liquidity) : null,
    active: data.active ?? true,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    resolutionSource: data.resolutionSource,
  }

  const market = await db.market.create({
    data: marketData,
  })

  return toMarketDTO(market)
}

/**
 * Update an existing market
 */
export async function updateMarket(
  db: PrismaContext,
  id: string,
  data: {
    question?: string
    description?: string
    outcomes?: string[]
    outcomePrices?: number[]
    volume?: number
    liquidity?: number
    active?: boolean
    closed?: boolean
    startDate?: string
    endDate?: string
    resolutionSource?: string
  }
): Promise<MarketDTO | null> {
  const updateData: Prisma.MarketUpdateInput = {
    ...(data.question && { question: data.question }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.outcomes && { outcomes: data.outcomes }),
    ...(data.outcomePrices && { outcomePrices: data.outcomePrices.map(p => new Prisma.Decimal(p)) }),
    ...(data.volume !== undefined && { volume: data.volume ? new Prisma.Decimal(data.volume) : null }),
    ...(data.liquidity !== undefined && { liquidity: data.liquidity ? new Prisma.Decimal(data.liquidity) : null }),
    ...(data.active !== undefined && { active: data.active }),
    ...(data.closed !== undefined && { closed: data.closed }),
    ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
    ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    ...(data.resolutionSource !== undefined && { resolutionSource: data.resolutionSource }),
    updatedAt: new Date(),
  }

  const market = await db.market.update({
    where: { id },
    data: updateData,
  })

  return toMarketDTO(market)
}

/**
 * Delete a market
 */
export async function deleteMarket(
  db: PrismaContext,
  id: string
): Promise<boolean> {
  try {
    await db.market.delete({
      where: { id },
    })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Record not found
      return false
    }
    throw error
  }
}

/**
 * Get markets by event ID
 */
export async function getMarketsByEventId(
  db: PrismaContext,
  eventId: string
): Promise<MarketDTO[]> {
  const markets = await db.market.findMany({
    where: { eventId },
    orderBy: { volume: 'desc' },
  })

  return markets.map(toMarketDTO)
}

/**
 * Convert Prisma market to DTO with proper serialization
 */
function toMarketDTO(market: any): MarketDTO {
  const serialized = serializeDecimals(market)
  
  return {
    id: serialized.id,
    question: serialized.question,
    eventId: serialized.eventId,
    outcomePrices: serialized.outcomePrices ?? [],
    volume: serialized.volume ?? null,
    liquidity: serialized.liquidity ?? null,
    description: serialized.description ?? null,
    active: serialized.active ?? null,
    closed: serialized.closed ?? null,
    endDate: serialized.endDate ?? null,
    updatedAt: serialized.updatedAt ?? null,
    slug: serialized.slug ?? null,
    startDate: serialized.startDate ?? null,
    resolutionSource: serialized.resolutionSource ?? null,
    outcomes: serialized.outcomes ?? [],
    icon: serialized.icon ?? null,
    image: serialized.image ?? null,
  }
}