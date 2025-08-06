import { db } from '@/lib/db'
import { marketQueryCache } from '@/lib/db/schema'
import { and, eq, gte, desc } from 'drizzle-orm'
import type { MarketQueryCache, NewMarketQueryCache } from '@/lib/types'

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function getCachedMarketQuery(
  marketId: string,
  modelName: string
): Promise<MarketQueryCache | null> {
  const oneHourAgo = new Date(Date.now() - CACHE_DURATION_MS);
  
  return await db.query.marketQueryCache.findFirst({
    where: and(
      eq(marketQueryCache.marketId, marketId),
      eq(marketQueryCache.modelName, modelName),
      gte(marketQueryCache.createdAt, oneHourAgo)
    ),
    orderBy: [desc(marketQueryCache.createdAt)]
  });
}

export async function createMarketQueryCache(
  cacheData: NewMarketQueryCache
): Promise<MarketQueryCache> {
  const [result] = await db.insert(marketQueryCache).values(cacheData).returning()
  return result
} 