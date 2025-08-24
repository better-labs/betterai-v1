import type { PrismaClient, Tag } from '@/lib/generated/prisma'

/**
 * Tag service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return raw models (tags are simple, no complex serialization needed)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getAllTags(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<Tag[]> {
  return await db.tag.findMany({
    orderBy: { label: 'asc' }
  })
}

export async function getTagsByEventId(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventId: string
): Promise<Tag[]> {
  const rows = await db.eventTag.findMany({
    where: { eventId },
    include: { tag: true }
  })
  return rows.map(r => r.tag)
}

export async function upsertTags(
  db: PrismaClient,
  tags: Array<{
    id: string
    label: string
    slug?: string | null
    forceShow?: boolean | null
    providerUpdatedAt?: Date | null
    provider?: string | null
  }>
): Promise<Tag[]> {
  if (!tags || tags.length === 0) return []
  
  const transactions = tags.map(t => db.tag.upsert({
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
  
  return await db.$transaction(transactions)
}

export async function linkTagsToEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  links: Array<{ eventId: string; tagId: string }>
): Promise<number> {
  if (!links || links.length === 0) return 0
  
  const result = await db.eventTag.createMany({
    data: links,
    skipDuplicates: true,
  })
  return result.count
}

export async function unlinkAllTagsFromEvent(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventId: string
): Promise<number> {
  const res = await db.eventTag.deleteMany({ where: { eventId } })
  return res.count
}

export async function unlinkAllTagsFromEvents(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  eventIds: string[]
): Promise<number> {
  if (!eventIds || eventIds.length === 0) return 0
  
  const res = await db.eventTag.deleteMany({ 
    where: { eventId: { in: eventIds } } 
  })
  return res.count
}

export async function getPopularTagsByMarketVolume(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit: number = 10
): Promise<Array<Tag & { totalVolume: number }>> {
  const result = await db.tag.findMany({
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
}

export async function searchTags(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    limit?: number
    includeEventCounts?: boolean
  }
): Promise<Array<Tag & { eventCount?: number }>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
  
  if (options?.includeEventCounts) {
    const tagsWithCounts = await db.tag.findMany({
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
  
  const tags = await db.tag.findMany({
    where: {
      label: { contains: searchTerm, mode: 'insensitive' }
    },
    orderBy: { label: 'asc' },
    take: limit,
  })
  
  return tags
}