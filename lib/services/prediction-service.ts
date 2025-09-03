import type { PrismaClient, Prediction, Market, Event } from '@/lib/generated/prisma'
import { mapPredictionToDTO } from '@/lib/dtos'
import type { PredictionDTO } from '@/lib/types'


/**
 * Prediction service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return DTOs (never raw Prisma models)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getPredictionWithRelationsById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: number
): Promise<(Prediction & { market: (Market & { event: Event | null }) | null }) | null> {
  return await db.prediction.findUnique({
    where: { id },
    include: {
      market: {
        include: {
          event: true,
        },
      },
    },
  })
}

export async function getPredictionWithRelationsByIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: number
): Promise<(PredictionDTO & { market: any | null }) | null> {
  const prediction = await getPredictionWithRelationsById(db, id)
  if (!prediction) return null
  
  return {
    ...mapPredictionToDTO(prediction),
    market: prediction.market ? {
      ...prediction.market,
      volume: prediction.market.volume ? Number(prediction.market.volume) : null,
      liquidity: prediction.market.liquidity ? Number(prediction.market.liquidity) : null,
      outcomePrices: prediction.market.outcomePrices ? prediction.market.outcomePrices.map(p => Number(p)) : [],
      event: prediction.market.event ? {
        ...prediction.market.event,
        volume: prediction.market.event.volume ? Number(prediction.market.event.volume) : null,
      } : null,
    } : null,
  }
}

export async function getPredictionsByMarketId(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<Array<Prediction & { market: Market | null }>> {
  return await db.prediction.findMany({
    where: { marketId },
    orderBy: { createdAt: 'desc' },
    include: {
      market: true
    }
  })
}

export async function getPredictionsByMarketIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<PredictionDTO[]> {
  const predictions = await getPredictionsByMarketId(db, marketId)
  return predictions.map(p => mapPredictionToDTO(p))
}

export async function getMostRecentPredictionByMarketId(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<Prediction | null> {
  return await db.prediction.findFirst({
    where: { marketId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMostRecentPredictionByMarketIdSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<PredictionDTO | null> {
  const prediction = await getMostRecentPredictionByMarketId(db, marketId)
  if (!prediction) return null
  return mapPredictionToDTO(prediction)
}

export async function getPredictionById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: number
): Promise<Prediction | null> {
  return await db.prediction.findUnique({
    where: { id }
  })
}

export async function getRecentPredictions(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit: number = 50
): Promise<Prediction[]> {
  return await db.prediction.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

export async function getRecentPredictionsWithRelations(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit: number = 20
): Promise<Array<Prediction & { market: (Market & { event: Event | null }) | null }>> {
  return await db.prediction.findMany({
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
}

export async function getRecentPredictionsWithRelationsPaginated(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  limit: number = 20,
  cursorId?: number | null,
  sortMode: 'markets' | 'predictions' = 'markets'
): Promise<{ items: Array<Prediction & { market: (Market & { event: Event | null }) | null }>; nextCursor: number | null }> {
  if (sortMode === 'markets') {
    // For trending markets, get the most recent prediction per market, sorted by market volume
    const markets = await db.market.findMany({
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

    const marketIds = markets.map(m => m.id)
    if (marketIds.length === 0) {
      return { items: [], nextCursor: null }
    }

    const predictions = await Promise.all(
      marketIds.slice(0, limit).map(async (marketId) => {
        return await db.prediction.findFirst({
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

    const rows = await db.prediction.findMany({
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
}

export async function getRecentPredictionsWithRelationsFilteredByTags(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  tagIds: string[],
  limit: number = 20,
  cursorId?: number | null,
  sortMode: 'markets' | 'predictions' = 'markets'
): Promise<{ items: Array<Prediction & { market: (Market & { event: Event | null }) | null }>; nextCursor: number | null }> {
  if (sortMode === 'markets') {
    const markets = await db.market.findMany({
      where: {
        volume: { not: null },
        predictions: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
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

    const marketIds = markets.map(m => m.id)
    if (marketIds.length === 0) {
      return { items: [], nextCursor: null }
    }

    const predictions = await Promise.all(
      marketIds.slice(0, limit).map(async (marketId) => {
        return await db.prediction.findFirst({
          where: {
            marketId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
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
      outcomesProbabilities: {
        isEmpty: false
      }
    }

    const rows = await db.prediction.findMany({
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
}

export async function createPrediction(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  predictionData: any
): Promise<Prediction> {
  // Ensure userId is null if not provided to avoid foreign key constraint violations
  const data = {
    ...predictionData,
    userId: predictionData.userId || null
  }
  return await db.prediction.create({ data })
}

export async function updatePrediction(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: number,
  predictionData: Partial<any>
): Promise<Prediction | null> {
  return await db.prediction.update({
    where: { id },
    data: predictionData
  })
}

export async function deletePrediction(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: number
): Promise<boolean> {
  const result = await db.prediction.delete({ where: { id } })
  return !!result
}

export async function getPredictionsByUserMessage(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  userMessage: string
): Promise<Prediction[]> {
  return await db.prediction.findMany({
    where: { userMessage },
    orderBy: { createdAt: 'desc' }
  })
}

export async function storePredictionResult(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  userMessage: string,
  predictionResult: any,
  aiResponse?: string
): Promise<Prediction> {
  const predictionData = {
    marketId,
    userMessage,
    predictionResult,
    aiResponse
  }
  
  const result = await createPrediction(db, predictionData)
  if (!result) {
    throw new Error("Failed to create prediction")
  }
  return result
}

export async function deleteAllPredictions(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<number> {
  const result = await db.prediction.deleteMany({})
  return result.count
}

export async function getPredictionByMarketId(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string
): Promise<Prediction | null> {
  return await db.prediction.findFirst({
    where: { marketId }
  })
}

export async function searchPredictionsByUserMessage(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  limit = 5
): Promise<Prediction[]> {
  return await db.prediction.findMany({
    where: {
      userMessage: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}