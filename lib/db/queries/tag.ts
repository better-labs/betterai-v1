import { prisma } from "../prisma"
import type { Tag } from '../../../lib/generated/prisma';

// Tag queries
export const tagQueries = {
  getAllTags: async (): Promise<Tag[]> => {
    return await prisma.tag.findMany({
      orderBy: { label: 'asc' }
    })
  },
  getTagsByEventId: async (eventId: string): Promise<Tag[]> => {
    const rows = await prisma.eventTag.findMany({
      where: { eventId },
      include: { tag: true }
    })
    return rows.map(r => r.tag)
  },
  upsertTags: async (tags: Array<{
    id: string
    label: string
    slug?: string | null
    forceShow?: boolean | null
    providerUpdatedAt?: Date | null
    provider?: string | null
  }>): Promise<Tag[]> => {
    if (!tags || tags.length === 0) return []
    const transactions = tags.map(t => prisma.tag.upsert({
      where: { id: t.id },
      update: {
        label: t.label,
        slug: t.slug ?? null,
        forceShow: t.forceShow ?? null,
        providerUpdatedAt: t.providerUpdatedAt ?? null,
        provider: t.provider ?? null,
      },
      create: {
        id: t.id,
        label: t.label,
        slug: t.slug ?? null,
        forceShow: t.forceShow ?? null,
        providerUpdatedAt: t.providerUpdatedAt ?? null,
        provider: t.provider ?? null,
      }
    }))
    return await prisma.$transaction(transactions)
  },
  linkTagsToEvents: async (links: Array<{ eventId: string; tagId: string }>): Promise<number> => {
    if (!links || links.length === 0) return 0
    const result = await prisma.eventTag.createMany({
      data: links,
      skipDuplicates: true,
    })
    return result.count
  },
  unlinkAllTagsFromEvent: async (eventId: string): Promise<number> => {
    const res = await prisma.eventTag.deleteMany({ where: { eventId } })
    return res.count
  },
  // Delete all event-tag links for a set of events with a single statement
  unlinkAllTagsFromEvents: async (eventIds: string[]): Promise<number> => {
    if (!eventIds || eventIds.length === 0) return 0
    const res = await prisma.eventTag.deleteMany({ where: { eventId: { in: eventIds } } })
    return res.count
  },
  // Get popular tags ordered by total market volume of their associated events
  getPopularTagsByMarketVolume: async (limit: number = 10): Promise<Array<Tag & { totalVolume: number }>> => {
    const result = await prisma.tag.findMany({
      where: {
        label: {
          notIn: ["Hide From New", "Weekly", "Recurring"]
        }
      },
      include: {
        events: {
          include: {
            event: {
              include: {
                markets: {
                  select: {
                    volume: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate total volume for each tag and sort
    const tagsWithVolume = result.map(tag => {
      const totalVolume = tag.events.reduce((sum, eventTag) => {
        const eventVolume = eventTag.event.markets.reduce((marketSum, market) => {
          return marketSum + (market.volume ? Number(market.volume) : 0)
        }, 0)
        return sum + eventVolume
      }, 0)
      
      return {
        ...tag,
        totalVolume,
        events: undefined // Remove the nested data we don't need in the response
      }
    }).filter(tag => tag.totalVolume > 0) // Only include tags with volume
      .sort((a, b) => b.totalVolume - a.totalVolume) // Sort by volume desc
      .slice(0, limit) // Take only the requested number

    return tagsWithVolume
  },
  /**
   * Search tags by label text
   */
  searchTags: async (
    searchTerm: string,
    options?: {
      limit?: number
      includeEventCounts?: boolean
    }
  ): Promise<Array<Tag & { eventCount?: number }>> => {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
    
    if (options?.includeEventCounts) {
      const tagsWithCounts = await prisma.tag.findMany({
        where: {
          label: { contains: searchTerm, mode: 'insensitive' }
        },
        include: {
          events: {
            select: { eventId: true }
          }
        },
        orderBy: { label: 'asc' },
        take: limit,
      })
      
      return tagsWithCounts.map(tag => ({
        ...tag,
        eventCount: tag.events.length,
        events: undefined // Remove the nested data we don't need in the response
      }))
    }
    
    const tags = await prisma.tag.findMany({
      where: {
        label: { contains: searchTerm, mode: 'insensitive' }
      },
      orderBy: { label: 'asc' },
      take: limit,
    })
    
    return tags
  },
}