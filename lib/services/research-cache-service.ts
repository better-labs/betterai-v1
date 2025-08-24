import type { PrismaClient, ResearchCache } from '@/lib/generated/prisma'

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Research Cache service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return raw models (no complex serialization needed)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getCachedResearch(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  modelName: string
): Promise<ResearchCache | null> {
  const oneHourAgo = new Date(Date.now() - CACHE_DURATION_MS);
  
  return await db.researchCache.findFirst({
    where: {
      marketId,
      modelName,
      createdAt: {
        gte: oneHourAgo
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createResearchCache(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  cacheData: any
): Promise<ResearchCache> {
  return await db.researchCache.create({ data: cacheData })
}