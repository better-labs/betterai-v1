import { prisma } from "./prisma"
import { Prisma } from '../../lib/generated/prisma'
import type { AiModel, Event, Market, Prediction, ResearchCache, PredictionCheck, Category, Tag, EventTag, User, UserWatchlist } from '../../lib/generated/prisma';
import { CATEGORY_DISPLAY_NAME } from '@/lib/categorize'

export type { AiModel as NewAIModel, Event as NewEvent, Prediction as NewPrediction, Market as NewMarket, ResearchCache as NewResearchCache, PredictionCheck as NewPredictionCheck, User as NewUser, UserWatchlist as NewUserWatchlist } from '../../lib/generated/prisma';

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

// AI Model queries
export const aiModelQueries = {
  getAllAIModels: async (): Promise<AiModel[]> => {
    return await prisma.aiModel.findMany({
      orderBy: { updatedAt: 'desc' }
    })
  },
  getAIModelById: async (id: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findUnique({
      where: { id }
    })
  },
  getAIModelBySlug: async (slug: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findFirst({
      where: { canonicalSlug: slug }
    })
  },
  createAIModel: async (modelData: any): Promise<AiModel> => {
    return await prisma.aiModel.create({ data: modelData })
  },
  updateAIModel: async (id: string, modelData: Partial<any>): Promise<AiModel | null> => {
    return await prisma.aiModel.update({
      where: { id },
      data: { ...modelData, updatedAt: new Date() }
    })
  },
  deleteAIModel: async (id: string): Promise<boolean> => {
    const result = await prisma.aiModel.delete({ where: { id } })
    return !!result
  },
  upsertAIModels: async (models: any[]): Promise<AiModel[]> => {
    if (models.length === 0) return []
    
    const transactions = models.map(model => 
      prisma.aiModel.upsert({
        where: { id: model.id },
        update: { ...model, updatedAt: new Date() },
        create: model
      })
    )
    
    return await prisma.$transaction(transactions)
  }
}

// Event queries
export const eventQueries = {
  getTrendingEvents: async (): Promise<Event[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10
    })
  },
  getTrendingEventsWithMarkets: async (): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      orderBy: { volume: 'desc' },
      take: 10,
      include: {
        markets: {
          orderBy: {
            volume: 'desc'
          }
        }
      }
    })
  },
  getEventById: async (id: string): Promise<Event | null> => {
    return await prisma.event.findUnique({
      where: { id }
    })
  },
  getEventBySlug: async (slug: string): Promise<Event | null> => {
    return await prisma.event.findFirst({
      where: { slug }
    })
  },
  createEvent: async (eventData: any): Promise<Event> => {
    return await prisma.event.create({ data: eventData })
  },
  updateEvent: async (id: string, eventData: Partial<any>): Promise<Event | null> => {
    return await prisma.event.update({
      where: { id },
      data: { ...eventData, updatedAt: new Date() }
    })
  },
  deleteEvent: async (id: string): Promise<boolean> => {
    const result = await prisma.event.delete({ where: { id } })
    return !!result
  },
  getEventsByCategory: async (category: Category): Promise<Event[]> => {
    return await prisma.event.findMany({
      where: { category },
      orderBy: { volume: 'desc' }
    })
  },
  getEventsByCategoryWithMarkets: async (category: Category): Promise<(Event & { markets: Market[] })[]> => {
    return await prisma.event.findMany({
      where: { category },
      orderBy: { volume: 'desc' },
      include: {
        markets: {
          orderBy: {
            volume: 'desc'
          }
        }
      }
    })
  },
  getCategoryStats: async (): Promise<Array<{
    category: Category;
    categoryName: string;
    eventCount: number;
  }>> => {
    const result = await prisma.event.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: {
        category: {
          not: null
        }
      }
    })
  
    return result.map(row => ({
      category: row.category as Category,
      categoryName: CATEGORY_DISPLAY_NAME[row.category as Category] || 'Unknown',
      eventCount: row._count.category
    })).sort((a, b) => b.eventCount - a.eventCount)
  },
  getTopEvents: async (limit = 10) => {
    return await prisma.event.findMany({
        orderBy: { volume: 'desc' },
        take: limit
    });
  },
  deleteAllEvents: async () => {
    const result = await prisma.event.deleteMany({})
    return result.count
  },
  upsertEvents: async (eventsData: any[]) => {
    if (eventsData.length === 0) {
      return [];
    }
    // Process in chunks to avoid very large transactions that hurt latency on serverless Postgres
    const results: Event[] = [] as unknown as Event[]
    const CHUNK_SIZE = 100
    for (let i = 0; i < eventsData.length; i += CHUNK_SIZE) {
      const chunk = eventsData.slice(i, i + CHUNK_SIZE)
      const transactions = chunk.map(event =>
        prisma.event.upsert({
          where: { id: event.id },
          update: { ...event, updatedAt: new Date() },
          create: event,
        })
      )
      const res = await prisma.$transaction(transactions)
      results.push(...(res as unknown as Event[]))
    }
    return results
  },
  /**
   * Search events by title and description text
   */
  searchEvents: async (
    searchTerm: string,
    options?: {
      limit?: number
      includeMarkets?: boolean
    }
  ): Promise<Array<Event & { markets?: Market[] }>> => {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
    
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: options?.includeMarkets ? {
        markets: {
          orderBy: { volume: 'desc' },
          take: 5 // Limit markets per event for performance
        }
      } : undefined,
      orderBy: { volume: 'desc' },
      take: limit,
    })
    
    return events
  },
}

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

// Market queries
export const marketQueries = {
  getMarketsByEventId: async (eventId: string): Promise<Market[]> => {
    return await prisma.market.findMany({
      where: { eventId },
      orderBy: { volume: 'desc' }
    })
  },
  getMarketById: async (id: string): Promise<Market | null> => {
    return await prisma.market.findUnique({
      where: { id }
    })
  },
  getHighVolumeMarkets: async (limit: number = 20): Promise<Market[]> => {
    return await prisma.market.findMany({
      where: { volume: { gt: 10000 } },
      orderBy: { volume: 'desc' },
      take: limit
    })
  },
  createMarket: async (marketData: any): Promise<Market> => {
    const marketWithId = {
      ...marketData,
      id: marketData.id || crypto.randomUUID()
    }
    if (!marketWithId.eventId) {
      throw new Error('eventId is required when creating a market')
    }
    return await prisma.market.create({ data: marketWithId })
  },
  updateMarket: async (id: string, marketData: Partial<any>): Promise<Market | null> => {
    return await prisma.market.update({
      where: { id },
      data: { ...marketData, updatedAt: new Date() }
    })
  },
  deleteMarket: async (id: string): Promise<boolean> => {
    const result = await prisma.market.delete({ where: { id } })
    return !!result
  },
  updateMarketVolume: async (id: string, newVolume: number): Promise<Market | null> => {
    return await prisma.market.update({
      where: { id },
      data: { volume: newVolume, updatedAt: new Date() }
    })
  },
  getTopMarkets: async (limit = 10) => {
    return await prisma.market.findMany({
        orderBy: { volume: 'desc' },
        take: limit
    });
  },
  deleteAllMarkets: async () => {
    const result = await prisma.market.deleteMany({})
    return result.count
  },
  upsertMarkets: async (marketsData: any[]) => {
    if (marketsData.length === 0) {
      return [];
    }
    // Process in chunks to reduce lock time and round trips
    const results: Market[] = [] as unknown as Market[]
    const CHUNK_SIZE = 100
    for (let i = 0; i < marketsData.length; i += CHUNK_SIZE) {
      const chunk = marketsData.slice(i, i + CHUNK_SIZE)
      const transactions = chunk.map(market =>
        prisma.market.upsert({
          where: { id: market.id },
          update: { ...market, updatedAt: new Date() },
          create: market,
        })
      )
      const res = await prisma.$transaction(transactions)
      results.push(...(res as unknown as Market[]))
    }
    return results
  },
  /**
   * Full‑text style search across markets and their related event/tag data.
   * Matches on:
   * - market.question
   * - market.description
   * - event.title
   * - event.description
   * - event → tags.label
   * Returns markets with the related event included for UI context.
   */
  searchMarkets: async (
    searchTerm: string,
    options?: {
      limit?: number
      onlyActive?: boolean
      orderBy?: 'volume' | 'liquidity' | 'updatedAt' // legacy param (mapped from sort)
      sort?: 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending' | 'competitive'
      status?: 'active' | 'resolved' | 'all'
      cursorId?: string | null
    }
  ): Promise<{ items: Array<Market & { event: Event | null, predictions: Prediction[] }>; nextCursor: string | null }> => {
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 100))
    const sort = options?.sort ?? 'trending'
    const status = options?.status ?? (options?.onlyActive ? 'active' : 'all')
    const orderKeyFromSort: 'volume' | 'liquidity' | 'updatedAt' | 'endDate' =
      sort === 'liquidity' ? 'liquidity'
      : sort === 'newest' ? 'updatedAt'
      : sort === 'ending' ? 'endDate'
      : 'volume' // trending and volume both map to volume for now
    const orderKey = options?.orderBy ?? orderKeyFromSort
    const cursorId = options?.cursorId ?? null

    const where: Prisma.MarketWhereInput = {
      OR: [
        { question: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        {
          event: {
            is: {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                {
                  eventTags: {
                    some: {
                      tag: { label: { contains: searchTerm, mode: 'insensitive' } },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    }

    // Status filter
    if (status === 'active') {
      where.active = true
    } else if (status === 'resolved') {
      // Prefer explicit closed flag if available
      where.closed = true
    }
    // For "ending" sort it is sensible to constrain to active
    if (sort === 'ending') {
      where.active = true
    }

    if (sort === 'competitive') {
      // Best-effort: fetch a larger slice, compute closeness to 0.5, then slice
      const baseRows = await prisma.market.findMany({
        where,
        include: { 
          event: true,
          predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: Math.min(limit * 5, 200),
      })

      const scored = baseRows
        .map((m) => {
          const p0Raw = Array.isArray((m as any).outcomePrices) ? (m as any).outcomePrices[0] : null
          const p0 = typeof p0Raw === 'number' ? p0Raw : (p0Raw && typeof (p0Raw as any).toNumber === 'function' ? Number((p0Raw as any).toNumber()) : Number(p0Raw))
          const prob = Number.isFinite(p0) ? (p0 as number) : null
          const distance = prob != null ? Math.abs(0.5 - (prob > 1 ? prob / 100 : prob)) : Number.POSITIVE_INFINITY
          return { m, distance }
        })
        .sort((a, b) => a.distance - b.distance)
        .map(({ m }) => m)
        .slice(0, limit)

      return { items: scored, nextCursor: null }
    }

    const direction = orderKey === 'endDate' ? 'asc' : 'desc'
    const orderBy: Prisma.MarketOrderByWithRelationInput[] = []
    // By default ("trending"), prioritize markets with predictions first
    if (sort === 'trending' || sort === undefined) {
      orderBy.push({ predictions: { _count: 'desc' } } as any)
    }
    orderBy.push({ [orderKey]: direction } as any)
    orderBy.push({ id: 'desc' })

    const rows = await prisma.market.findMany({
      where,
      include: { 
        event: true,
        predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy,
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    })

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null

    return { items, nextCursor }
  },
}

// Prediction queries
export const predictionQueries = {
  getPredictionWithRelationsById: async (id: number): Promise<(Prediction & { market: (Market & { event: Event | null }) | null }) | null> => {
    return await prisma.prediction.findUnique({
      where: { id },
      include: {
        market: {
          include: {
            event: true,
          },
        },
      },
    })
  },
  getPredictionsByMarketId: async (marketId: string): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' }
    })
  },
  getPredictionById: async (id: number): Promise<Prediction | null> => {
    return await prisma.prediction.findUnique({
      where: { id }
    })
  },
  getRecentPredictions: async (limit: number = 50): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
  /**
   * Fetches the most recent predictions including their related market and event
   * to support UI components that need contextual information.
   */
  getRecentPredictionsWithRelations: async (
    limit: number = 20
  ): Promise<Array<Prediction & { market: (Market & { event: Event | null }) | null }>> => {
    return await prisma.prediction.findMany({
      // Keep this simple helper for existing callers
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        market: {
          include: {
            event: true,
          },
        },
      },
    })
  },
  /**
   * Cursor-paginated recent predictions with related market + event.
   * Orders by id desc for stability and to align with cursor semantics.
   */
  getRecentPredictionsWithRelationsPaginated: async (
    limit: number = 20,
    cursorId?: number | null,
    sortMode: 'markets' | 'predictions' = 'markets'
  ): Promise<{ items: Array<Prediction & { market: (Market & { event: Event | null }) | null }>; nextCursor: number | null }> => {
    if (sortMode === 'markets') {
      // For trending markets, get the most recent prediction per market, sorted by market volume
      // First, get markets with predictions in the last 24 hours, sorted by volume
      const markets = await prisma.market.findMany({
        where: {
          volume: { not: null },
          predictions: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
              }
            }
          },
          event: {
            eventTags: {
              none: {
                tag: {
                  label: {
                    in: ["Hide From New", "Weekly", "Recurring"]
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { volume: 'desc' },
          { id: 'desc' }
        ],
        take: limit + 1,
        ...(cursorId ? { 
          cursor: { id: cursorId as unknown as string }, 
          skip: 1 
        } : {}),
        select: { id: true }
      })

      // Then get the most recent prediction for each market
      const marketIds = markets.map(m => m.id)
      if (marketIds.length === 0) {
        return { items: [], nextCursor: null }
      }

      const predictions = await Promise.all(
        marketIds.slice(0, limit).map(async (marketId) => {
          return await prisma.prediction.findFirst({
            where: {
              marketId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
              }
            },
            orderBy: { createdAt: 'desc' },
            include: {
              market: {
                include: { event: true },
              },
            },
          })
        })
      )

      const validPredictions = predictions.filter(p => p !== null) as Array<Prediction & { market: (Market & { event: Event | null }) | null }>
      const hasMore = markets.length > limit
      const nextCursor = hasMore ? (markets[limit - 1]?.id as unknown as number) ?? null : null

      return { items: validPredictions, nextCursor }
    } else {
      // For predictions mode, use the original logic
      const orderBy = [{ createdAt: 'desc' as const }]
      
      const whereCondition: any = {
        market: {
          event: {
            eventTags: {
              none: {
                tag: {
                  label: {
                    in: ["Hide From New", "Weekly", "Recurring"]
                  }
                }
              }
            }
          }
        },
        // For predictions mode, only show predictions with AI probabilities
        outcomesProbabilities: {
          isEmpty: false
        }
      }

      const rows = await prisma.prediction.findMany({
        where: whereCondition,
        orderBy,
        take: limit + 1,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        include: {
          market: {
            include: { event: true },
          },
        },
      })

      const hasMore = rows.length > limit
      const items = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? (items[items.length - 1]?.id as unknown as number) ?? null : null

      return { items, nextCursor }
    }
  },
  /**
   * Cursor-paginated recent predictions filtered by tag IDs.
   * Orders by id desc for stability and to align with cursor semantics.
   */
  getRecentPredictionsWithRelationsFilteredByTags: async (
    tagIds: string[],
    limit: number = 20,
    cursorId?: number | null,
    sortMode: 'markets' | 'predictions' = 'markets'
  ): Promise<{ items: Array<Prediction & { market: (Market & { event: Event | null }) | null }>; nextCursor: number | null }> => {
    if (sortMode === 'markets') {
      // For trending markets, get the most recent prediction per market, sorted by market volume
      // First, get markets with predictions in the last 24 hours, sorted by volume
      const markets = await prisma.market.findMany({
        where: {
          volume: { not: null },
          predictions: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
              }
            }
          },
          event: {
            AND: [
              {
                eventTags: {
                  some: {
                    tagId: {
                      in: tagIds
                    }
                  }
                }
              },
              {
                eventTags: {
                  none: {
                    tag: {
                      label: {
                        in: ["Hide From New", "Weekly", "Recurring"]
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        orderBy: [
          { volume: 'desc' },
          { id: 'desc' }
        ],
        take: limit + 1,
        ...(cursorId ? { 
          cursor: { id: cursorId as unknown as string }, 
          skip: 1 
        } : {}),
        select: { id: true }
      })

      // Then get the most recent prediction for each market
      const marketIds = markets.map(m => m.id)
      if (marketIds.length === 0) {
        return { items: [], nextCursor: null }
      }

      const predictions = await Promise.all(
        marketIds.slice(0, limit).map(async (marketId) => {
          return await prisma.prediction.findFirst({
            where: {
              marketId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
              }
            },
            orderBy: { createdAt: 'desc' },
            include: {
              market: {
                include: { 
                  event: {
                    include: {
                      eventTags: {
                        include: {
                          tag: true
                        }
                      }
                    }
                  }
                },
              },
            },
          })
        })
      )

      const validPredictions = predictions.filter(p => p !== null) as Array<Prediction & { market: (Market & { event: Event | null }) | null }>
      const hasMore = markets.length > limit
      const nextCursor = hasMore ? (markets[limit - 1]?.id as unknown as number) ?? null : null

      return { items: validPredictions, nextCursor }
    } else {
      // For predictions mode, use the original logic
      const orderBy = [{ createdAt: 'desc' as const }]
      
      const whereCondition: any = {
        market: {
          event: {
            AND: [
              {
                eventTags: {
                  some: {
                    tagId: {
                      in: tagIds
                    }
                  }
                }
              },
              {
                eventTags: {
                  none: {
                    tag: {
                      label: {
                        in: ["Hide From New", "Weekly", "Recurring"]
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        // For predictions mode, only show predictions with AI probabilities
        outcomesProbabilities: {
          not: null
        }
      }

      const rows = await prisma.prediction.findMany({
        where: whereCondition,
        orderBy,
        take: limit + 1,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        include: {
          market: {
            include: { 
              event: {
                include: {
                  eventTags: {
                    include: {
                      tag: true
                    }
                  }
                }
              }
            },
          },
        },
      })

      const hasMore = rows.length > limit
      const items = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? (items[items.length - 1]?.id as unknown as number) ?? null : null

      return { items, nextCursor }
    }
  },
  createPrediction: async (predictionData: any): Promise<Prediction> => {
    // Ensure userId is null if not provided to avoid foreign key constraint violations
    const data = {
      ...predictionData,
      userId: predictionData.userId || null
    }
    return await prisma.prediction.create({ data })
  },
  updatePrediction: async (id: number, predictionData: Partial<any>): Promise<Prediction | null> => {
    return await prisma.prediction.update({
      where: { id },
      data: predictionData
    })
  },
  deletePrediction: async (id: number): Promise<boolean> => {
    const result = await prisma.prediction.delete({ where: { id } })
    return !!result
  },
  getPredictionsByUserMessage: async (userMessage: string): Promise<Prediction[]> => {
    return await prisma.prediction.findMany({
      where: { userMessage },
      orderBy: { createdAt: 'desc' }
    })
  },
  storePredictionResult: async (
    marketId: string,
    userMessage: string,
    predictionResult: any,
    aiResponse?: string
  ): Promise<Prediction> => {
    const predictionData = {
      marketId,
      userMessage,
      predictionResult,
      aiResponse
    }
    
    const result = await predictionQueries.createPrediction(predictionData)
    if (!result) {
      throw new Error("Failed to create prediction")
    }
    return result
  },
  getMostRecentPredictionByMarketId: async (marketId: string): Promise<Prediction | null> => {
    return await prisma.prediction.findFirst({
      where: { marketId },
      orderBy: { createdAt: 'desc' }
    })
  },
  deleteAllPredictions: async () => {
    const result = await prisma.prediction.deleteMany({})
    return result.count
  },
  getPredictionByMarketId: async (marketId: string) => {
    return await prisma.prediction.findFirst({
        where: { marketId }
    });
  },
  searchPredictionsByUserMessage: async (searchTerm: string, limit = 5) => {
    return await prisma.prediction.findMany({
      where: {
        userMessage: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
}

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
}

// User queries
export const userQueries = {
  getUserById: async (id: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { id }
    })
  },
  getUserByEmail: async (email: string): Promise<User | null> => {
    return await prisma.user.findFirst({
      where: { email }
    })
  },
  getUserByWalletAddress: async (walletAddress: string): Promise<User | null> => {
    return await prisma.user.findFirst({
      where: { walletAddress }
    })
  },
  createUser: async (userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }): Promise<User> => {
    return await prisma.user.create({ data: userData })
  },
  updateUser: async (id: string, userData: Partial<{
    email: string
    walletAddress: string
    username: string
    avatar: string
  }>): Promise<User | null> => {
    return await prisma.user.update({
      where: { id },
      data: { ...userData, updatedAt: new Date() }
    })
  },
  upsertUser: async (userData: {
    id: string
    email?: string
    walletAddress?: string
    username?: string
    avatar?: string
  }): Promise<User> => {
    return await prisma.user.upsert({
      where: { id: userData.id },
      update: { ...userData, updatedAt: new Date() },
      create: userData
    })
  },
  deleteUser: async (id: string): Promise<boolean> => {
    const result = await prisma.user.delete({ where: { id } })
    return !!result
  },
  getUserWithPredictions: async (id: string): Promise<(User & { predictions: Prediction[] }) | null> => {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }
}

// User Watchlist queries
export const userWatchlistQueries = {
  getUserWatchlist: async (userId: string): Promise<(UserWatchlist & { market: Market })[]> => {
    return await prisma.userWatchlist.findMany({
      where: { userId },
      include: {
        market: true
      },
      orderBy: { addedAt: 'desc' }
    })
  },
  addToWatchlist: async (userId: string, marketId: string): Promise<UserWatchlist> => {
    return await prisma.userWatchlist.create({
      data: {
        userId,
        marketId
      }
    })
  },
  removeFromWatchlist: async (userId: string, marketId: string): Promise<boolean> => {
    const result = await prisma.userWatchlist.deleteMany({
      where: {
        userId,
        marketId
      }
    })
    return result.count > 0
  },
  isInWatchlist: async (userId: string, marketId: string): Promise<boolean> => {
    const watchlistItem = await prisma.userWatchlist.findFirst({
      where: {
        userId,
        marketId
      }
    })
    return !!watchlistItem
  },
  getWatchlistCount: async (userId: string): Promise<number> => {
    return await prisma.userWatchlist.count({
      where: { userId }
    })
  }
}

// Leaderboard queries
export const leaderboardQueries = {
  /**
   * Get AI model leaderboard based on prediction accuracy on resolved markets
   */
  getAIModelLeaderboard: async (): Promise<Array<{
    modelName: string
    totalPredictions: number
    resolvedPredictions: number
    correctPredictions: number
    accuracyRate: number
    avgConfidenceInWinner: number
    lastPredictionAt: Date
  }>> => {
    // First, get all predictions with their market data
    const predictions = await prisma.prediction.findMany({
      where: {
        modelName: { not: null }
      },
      include: {
        market: {
          select: {
            id: true,
            outcomePrices: true,
            closed: true
          }
        }
      }
    })

    // Process the results to calculate accuracy
    const modelStats = new Map<string, {
      totalPredictions: number
      resolvedPredictions: number
      correctPredictions: number
      confidenceSum: number
      lastPredictionAt: Date
    }>()

    predictions.forEach(prediction => {
      if (!prediction.modelName) return

      const modelName = prediction.modelName
      const stats = modelStats.get(modelName) || {
        totalPredictions: 0,
        resolvedPredictions: 0,
        correctPredictions: 0,
        confidenceSum: 0,
        lastPredictionAt: prediction.createdAt || new Date()
      }

      stats.totalPredictions++
      if (prediction.createdAt && prediction.createdAt > stats.lastPredictionAt) {
        stats.lastPredictionAt = prediction.createdAt
      }

      // Check if market is resolved and binary
      const market = prediction.market
      const prices = market?.outcomePrices || []
      const probabilities = prediction.outcomesProbabilities || []
      
      if (prices.length === 2 && probabilities.length === 2) {
        // Convert Prisma Decimal to number and check if market has a clear winner
        const price1 = Number(prices[0])
        const price2 = Number(prices[1])
        const prob1 = Number(probabilities[0])
        const prob2 = Number(probabilities[1])
        
        // Check if market is resolved (one outcome = 1, other = 0)
        if ((price1 === 1 && price2 === 0) || (price1 === 0 && price2 === 1)) {
          stats.resolvedPredictions++
          
          // Calculate AI confidence in the winning outcome
          const aiConfidenceInWinner = price1 === 1 ? prob1 : prob2
          stats.confidenceSum += aiConfidenceInWinner
          
          // Check if AI predicted correctly (assigned ≥50% to winner)
          if (aiConfidenceInWinner >= 0.5) {
            stats.correctPredictions++
          }
        }
      }

      modelStats.set(modelName, stats)
    })

    // Convert to final format
    const leaderboard = Array.from(modelStats.entries()).map(([modelName, stats]) => ({
      modelName,
      totalPredictions: stats.totalPredictions,
      resolvedPredictions: stats.resolvedPredictions,
      correctPredictions: stats.correctPredictions,
      accuracyRate: stats.resolvedPredictions > 0 ? stats.correctPredictions / stats.resolvedPredictions : 0,
      avgConfidenceInWinner: stats.resolvedPredictions > 0 ? stats.confidenceSum / stats.resolvedPredictions : 0,
      lastPredictionAt: stats.lastPredictionAt
    }))

    // Sort by accuracy, then by resolved predictions, then by total predictions
    return leaderboard.sort((a, b) => {
      if (a.accuracyRate !== b.accuracyRate) return b.accuracyRate - a.accuracyRate
      if (a.resolvedPredictions !== b.resolvedPredictions) return b.resolvedPredictions - a.resolvedPredictions
      return b.totalPredictions - a.totalPredictions
    })
  },

  /**
   * Get leaderboard filtered by category/tag
   */
  getAIModelLeaderboardByTag: async (tagLabel: string): Promise<Array<{
    modelName: string
    totalPredictions: number
    resolvedPredictions: number
    correctPredictions: number
    accuracyRate: number
    avgConfidenceInWinner: number
    lastPredictionAt: Date
  }>> => {
    // Get predictions filtered by tag
    const predictions = await prisma.prediction.findMany({
      where: {
        modelName: { not: null },
        market: {
          event: {
            eventTags: {
              some: {
                tag: {
                  label: {
                    equals: tagLabel,
                    mode: 'insensitive'
                  }
                }
              }
            }
          }
        }
      },
      include: {
        market: {
          select: {
            id: true,
            outcomePrices: true,
            closed: true
          }
        }
      }
    })

    // Process the results to calculate accuracy (same logic as main leaderboard)
    const modelStats = new Map<string, {
      totalPredictions: number
      resolvedPredictions: number
      correctPredictions: number
      confidenceSum: number
      lastPredictionAt: Date
    }>()

    predictions.forEach(prediction => {
      if (!prediction.modelName) return

      const modelName = prediction.modelName
      const stats = modelStats.get(modelName) || {
        totalPredictions: 0,
        resolvedPredictions: 0,
        correctPredictions: 0,
        confidenceSum: 0,
        lastPredictionAt: prediction.createdAt || new Date()
      }

      stats.totalPredictions++
      if (prediction.createdAt && prediction.createdAt > stats.lastPredictionAt) {
        stats.lastPredictionAt = prediction.createdAt
      }

      // Check if market is resolved and binary
      const market = prediction.market
      const prices = market?.outcomePrices || []
      const probabilities = prediction.outcomesProbabilities || []
      
      if (prices.length === 2 && probabilities.length === 2) {
        // Convert Prisma Decimal to number and check if market has a clear winner
        const price1 = Number(prices[0])
        const price2 = Number(prices[1])
        const prob1 = Number(probabilities[0])
        const prob2 = Number(probabilities[1])
        
        // Check if market is resolved (one outcome = 1, other = 0)
        if ((price1 === 1 && price2 === 0) || (price1 === 0 && price2 === 1)) {
          stats.resolvedPredictions++
          
          const aiConfidenceInWinner = price1 === 1 ? prob1 : prob2
          stats.confidenceSum += aiConfidenceInWinner
          
          if (aiConfidenceInWinner >= 0.5) {
            stats.correctPredictions++
          }
        }
      }

      modelStats.set(modelName, stats)
    })

    // Convert to final format
    const leaderboard = Array.from(modelStats.entries()).map(([modelName, stats]) => ({
      modelName,
      totalPredictions: stats.totalPredictions,
      resolvedPredictions: stats.resolvedPredictions,
      correctPredictions: stats.correctPredictions,
      accuracyRate: stats.resolvedPredictions > 0 ? stats.correctPredictions / stats.resolvedPredictions : 0,
      avgConfidenceInWinner: stats.resolvedPredictions > 0 ? stats.confidenceSum / stats.resolvedPredictions : 0,
      lastPredictionAt: stats.lastPredictionAt
    }))

    return leaderboard.sort((a, b) => {
      if (a.accuracyRate !== b.accuracyRate) return b.accuracyRate - a.accuracyRate
      if (a.resolvedPredictions !== b.resolvedPredictions) return b.resolvedPredictions - a.resolvedPredictions
      return b.totalPredictions - a.totalPredictions
    })
  }
}

// Unified search functionality
export const searchQueries = {
  /**
   * Unified search across all entity types
   */
  searchAll: async (
    searchTerm: string,
    options?: {
      includeMarkets?: boolean
      includeEvents?: boolean  
      includeTags?: boolean
      limit?: number
      marketOptions?: Parameters<typeof marketQueries.searchMarkets>[1]
    }
  ): Promise<{
    markets: Array<Market & { event: Event | null, predictions: Prediction[] }>
    events: Array<Event & { markets?: Market[] }>
    tags: Array<Tag & { eventCount?: number }>
    totalResults: number
    suggestions?: string[]
  }> => {
    const limit = options?.limit ?? 10
    const includeMarkets = options?.includeMarkets ?? true
    const includeEvents = options?.includeEvents ?? true
    const includeTags = options?.includeTags ?? true

    // Run searches in parallel for better performance
    const [marketsResult, events, tags] = await Promise.all([
      includeMarkets 
        ? marketQueries.searchMarkets(searchTerm, { 
            ...options?.marketOptions, 
            limit 
          })
        : { items: [], nextCursor: null },
      includeEvents 
        ? eventQueries.searchEvents(searchTerm, { 
            limit, 
            includeMarkets: false 
          })
        : [],
      includeTags 
        ? tagQueries.searchTags(searchTerm, { 
            limit, 
            includeEventCounts: true 
          })
        : []
    ])

    const totalResults = marketsResult.items.length + events.length + tags.length

    return {
      markets: marketsResult.items,
      events,
      tags,
      totalResults,
      suggestions: totalResults === 0 ? await generateSearchSuggestions(searchTerm) : undefined
    }
  }
}

/**
 * Generate search suggestions when no results are found
 */
async function generateSearchSuggestions(searchTerm: string): Promise<string[]> {
  // Get popular tags as suggestions
  const popularTags = await tagQueries.getPopularTagsByMarketVolume(5)
  const suggestions = popularTags.map(tag => tag.label)
  
  // Add some common search patterns
  const commonSuggestions = [
    'election',
    'politics', 
    'sports',
    'crypto',
    'stock market'
  ].filter(s => !suggestions.includes(s))
  
  return [...suggestions, ...commonSuggestions].slice(0, 5)
}