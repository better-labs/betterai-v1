import { prisma } from "../prisma"
import type { Prediction, Market, Event } from '../../../lib/generated/prisma';
import { serializeDecimals, type SerializeDecimals } from "@/lib/serialization"
import type { PredictionOutput } from "@/lib/trpc/schemas"

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
  /** Serialized wrappers returning DTO-safe shapes */
  getPredictionWithRelationsByIdSerialized: async (
    id: number
  ): Promise<(PredictionOutput & { market: (ReturnType<typeof serializeDecimals> & any) | null }) | null> => {
    const row = await predictionQueries.getPredictionWithRelationsById(id)
    if (!row) return null
    
    // First serialize the entire object to handle all decimal fields recursively
    const serialized = serializeDecimals(row) as any
    
    return {
      id: serialized.id,
      userMessage: serialized.userMessage,
      marketId: serialized.marketId,
      predictionResult: serialized.predictionResult,
      modelName: serialized.modelName,
      systemPrompt: serialized.systemPrompt,
      aiResponse: serialized.aiResponse,
      createdAt: serialized.createdAt,
      outcomes: serialized.outcomes || [],
      outcomesProbabilities: serialized.outcomesProbabilities || [],
      userId: serialized.userId,
      experimentTag: serialized.experimentTag,
      experimentNotes: serialized.experimentNotes,
      market: serialized.market, // This will now have all decimals converted to numbers
    }
  },
  getPredictionsByMarketIdSerialized: async (
    marketId: string
  ): Promise<PredictionOutput[]> => {
    const rows = await predictionQueries.getPredictionsByMarketId(marketId)
    const s = serializeDecimals(rows) as any[]
    return s.map((p) => ({
      id: p.id,
      userMessage: p.userMessage,
      marketId: p.marketId,
      predictionResult: p.predictionResult,
      modelName: p.modelName,              // Keep as-is (already null if missing)
      systemPrompt: p.systemPrompt,        // Keep as-is (already null if missing)
      aiResponse: p.aiResponse,            // Keep as-is (already null if missing)
      createdAt: p.createdAt,
      outcomes: p.outcomes || [],          // Default to empty array if missing
      outcomesProbabilities: p.outcomesProbabilities || [], // Default to empty array if missing
      userId: p.userId,                    // Keep as-is (already null if missing)
      experimentTag: p.experimentTag,      // Keep as-is (already null if missing)
      experimentNotes: p.experimentNotes,  // Keep as-is (already null if missing)
    }))
  },
  getMostRecentPredictionByMarketIdSerialized: async (
    marketId: string
  ): Promise<PredictionOutput | null> => {
    const row = await predictionQueries.getMostRecentPredictionByMarketId(marketId)
    if (!row) return null
    const p = serializeDecimals(row) as any
    return {
      id: p.id, // Keep as number, not string
      userMessage: p.userMessage,
      marketId: p.marketId,
      predictionResult: p.predictionResult,
      modelName: p.modelName ?? null,
      systemPrompt: p.systemPrompt ?? null,
      aiResponse: p.aiResponse ?? null,
      createdAt: p.createdAt,
      outcomes: p.outcomes ?? [],
      outcomesProbabilities: p.outcomesProbabilities ?? [],
      userId: p.userId ?? null,
      experimentTag: p.experimentTag ?? null,
      experimentNotes: p.experimentNotes ?? null,
    }
  },

  /**
   * Most recent prediction for a market, including market and event relations
   */
  getMostRecentPredictionWithRelationsByMarketIdSerialized: async (
    marketId: string
  ): Promise<(PredictionOutput & { market: any | null }) | null> => {
    const row = await prisma.prediction.findFirst({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      include: {
        market: { include: { event: true } },
      },
    })
    if (!row) return null
    
    // Serialize the entire object to handle all decimal fields recursively
    const serialized = serializeDecimals(row) as any
    
    return {
      id: serialized.id,
      userMessage: serialized.userMessage,
      marketId: serialized.marketId,
      predictionResult: serialized.predictionResult,
      modelName: serialized.modelName ?? null,
      systemPrompt: serialized.systemPrompt ?? null,
      aiResponse: serialized.aiResponse ?? null,
      createdAt: serialized.createdAt,
      outcomes: serialized.outcomes ?? [],
      outcomesProbabilities: serialized.outcomesProbabilities ?? [],
      userId: serialized.userId ?? null,
      experimentTag: serialized.experimentTag ?? null,
      experimentNotes: serialized.experimentNotes ?? null,
      market: serialized.market ?? null, // All decimals now converted to numbers
    }
  },
  getPredictionsByMarketId: async (marketId: string): Promise<Array<Prediction & { market: Market | null }>> => {
    return await prisma.prediction.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      include: {
        market: true
      }
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

  /**
   * Get recent predictions with filters for the tRPC router
   */
  getRecentPredictionsWithFilters: async (params: {
    eventId?: string
    eventTagsWhere: any
    limit: number
    cursor?: number
  }): Promise<Array<PredictionOutput & { market: any | null }>> => {
    const { eventId, eventTagsWhere, limit, cursor } = params
    
    const whereCondition = {
      market: {
        ...(eventId && { eventId }),
        event: {
          eventTags: eventTagsWhere,
        },
      },
      outcomesProbabilities: {
        isEmpty: false,
      },
    }

    const rows = await prisma.prediction.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        market: {
          include: { event: true },
        },
      },
    })

    // Serialize the entire results array to handle all decimal fields recursively
    const serialized = serializeDecimals(rows) as any[]
    return serialized.map((p) => ({
      id: p.id,
      userMessage: p.userMessage,
      marketId: p.marketId,
      predictionResult: p.predictionResult,
      modelName: p.modelName ?? null,
      systemPrompt: p.systemPrompt ?? null,
      aiResponse: p.aiResponse ?? null,
      createdAt: p.createdAt,
      outcomes: p.outcomes ?? [],
      outcomesProbabilities: p.outcomesProbabilities ?? [],
      userId: p.userId ?? null,
      experimentTag: p.experimentTag ?? null,
      experimentNotes: p.experimentNotes ?? null,
      market: p.market ?? null, // All decimals now converted to numbers
    }))
  },

  /**
   * Search predictions by message with serialized output
   */
  searchPredictionsByMessageSerialized: async (searchTerm: string, limit = 5): Promise<PredictionOutput[]> => {
    const rows = await predictionQueries.searchPredictionsByUserMessage(searchTerm, limit)
    const s = serializeDecimals(rows) as any[]
    return s.map((p) => ({
      id: p.id,
      userMessage: p.userMessage,
      marketId: p.marketId,
      predictionResult: p.predictionResult,
      modelName: p.modelName ?? null,
      systemPrompt: p.systemPrompt ?? null,
      aiResponse: p.aiResponse ?? null,
      createdAt: p.createdAt,
      outcomes: p.outcomes ?? [],
      outcomesProbabilities: p.outcomesProbabilities ?? [],
      userId: p.userId ?? null,
      experimentTag: p.experimentTag ?? null,
      experimentNotes: p.experimentNotes ?? null,
    }))
  },

  /**
   * Get experiments with checks for the experiments API route
   */
  getExperimentsWithChecks: async () => {
    return await prisma.prediction.findMany({
      where: {
        experimentTag: {
          not: null
        }
      },
      select: {
        id: true,
        experimentTag: true,
        experimentNotes: true,
        modelName: true,
        createdAt: true,
        predictionChecks: {
          select: {
            absDelta: true,
            marketClosed: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  /**
   * Get predictions for checking with market and event data
   */
  getPredictionsForChecking: async (sinceDate: Date, maxPredictions: number) => {
    return await prisma.prediction.findMany({
      where: {
        createdAt: { gte: sinceDate },
      },
      orderBy: { createdAt: 'desc' },
      take: maxPredictions,
      include: {
        market: {
          include: {
            event: true,
          },
        },
      },
    })
  },
}