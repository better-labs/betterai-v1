import { prisma } from "../prisma"
import type { ResearchCache } from '../../../lib/generated/prisma';

// Research Cache queries
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const researchCacheQueries = {
  getCachedResearch: async (
    marketId: string,
    modelName: string
  ): Promise<ResearchCache | null> => {
    const oneHourAgo = new Date(Date.now() - CACHE_DURATION_MS);
    
    return await prisma.researchCache.findFirst({
      where: {
        marketId,
        modelName,
        createdAt: {
          gte: oneHourAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  createResearchCache: async (
    cacheData: any
  ): Promise<ResearchCache> => {
    return await prisma.researchCache.create({ data: cacheData })
  }
}