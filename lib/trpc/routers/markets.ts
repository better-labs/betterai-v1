/**
 * Markets tRPC router - Phase 5A implementation
 * Implements comprehensive market search, filtering, and CRUD operations
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure, authenticatedProcedure, adminProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as marketService from '@/lib/services/market-service'
import * as eventService from '@/lib/services/event-service'
import {
  GetMarketsInput,
  GetMarketByIdInput,
  CreateMarketInput,
  UpdateMarketInput,
  DeleteMarketInput,
  GetTrendingMarketsInput,
} from '../schemas/market'

export const marketsRouter = router({
  // Single market query by ID
  getById: publicProcedure
    .input(GetMarketByIdInput)
    .query(async ({ input }) => {
      const market = await marketService.getMarketByIdSerialized(prisma, input.id)
      if (!market) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Market not found',
        })
      }
      return market
    }),


  // List markets with various filters (main endpoint)
  list: publicProcedure
    .input(GetMarketsInput)
    .query(async ({ input }) => {
      // If search query provided, use search functionality
      if (input.search) {
        const result = await marketService.searchMarkets(prisma, input.search, {
          limit: input.limit,
          sort: input.sort,
          status: input.status,
          cursorId: input.cursor,
        })

        return {
          items: result.items,
          nextCursor: result.nextCursor,
          hasMore: !!result.nextCursor,
        }
      }

      // Single market by ID
      if (input.id) {
        const market = await marketService.getMarketByIdSerialized(prisma, input.id)
        if (!market) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Market not found',
          })
        }
        return {
          items: [market],
          nextCursor: null,
          hasMore: false,
        }
      }

      // Markets by event ID
      if (input.eventId) {
        const markets = await marketService.getMarketsByEventIdSerialized(prisma, input.eventId)
        return {
          items: markets,
          nextCursor: null,
          hasMore: false,
        }
      }

      // Default: get high volume markets
      const markets = await marketService.getHighVolumeMarkets(prisma, input.limit)
      const marketDTOs = markets.map(market => ({
        ...market,
        volume: market.volume?.toString() || '0',
        liquidity: market.liquidity?.toString() || '0',
        outcomePrices: Array.isArray(market.outcomePrices) 
          ? market.outcomePrices 
          : typeof market.outcomePrices === 'string' 
            ? JSON.parse(market.outcomePrices) 
            : [],
      }))
      
      return {
        items: marketDTOs,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Trending markets endpoint (kept separate due to different data structure)
  // This returns markets with event context, different from regular market list
  trending: publicProcedure
    .input(GetTrendingMarketsInput)
    .query(async ({ input }) => {
      // Get events with markets using the event service - always prioritize predictions in sorting
      const eventsWithMarkets = await eventService.getTrendingEventsWithMarkets(prisma, false, 4, input.tagIds)

            // Extract markets from events and flatten
      const trendingMarkets = eventsWithMarkets.flatMap((event: any) =>
        event.markets?.map((market: any) => ({
          ...market,
          // Serialize Decimal fields properly
          volume: market.volume?.toString() || '0',
          liquidity: market.liquidity?.toString() || '0',
          outcomePrices: Array.isArray(market.outcomePrices)
            ? market.outcomePrices
            : typeof market.outcomePrices === 'string'
              ? JSON.parse(market.outcomePrices)
              : [],
          // Serialize dates to ISO strings to match MarketDTO
          endDate: market.endDate?.toISOString() || null,
          startDate: market.startDate?.toISOString() || null,
          updatedAt: market.updatedAt?.toISOString() || null,
          // Include latest prediction data if available
          latestPrediction: market.predictions?.[0] ? {
            id: market.predictions[0].id,
            outcomes: typeof market.predictions[0].outcomes === 'string' 
              ? JSON.parse(market.predictions[0].outcomes) 
              : market.predictions[0].outcomes,
            outcomesProbabilities: typeof market.predictions[0].outcomesProbabilities === 'string'
              ? JSON.parse(market.predictions[0].outcomesProbabilities)
              : market.predictions[0].outcomesProbabilities,
            createdAt: market.predictions[0].createdAt?.toISOString() || null,
            modelName: market.predictions[0].modelName,
            predictionResult: typeof market.predictions[0].predictionResult === 'string'
              ? JSON.parse(market.predictions[0].predictionResult)
              : market.predictions[0].predictionResult,
          } : null,
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            icon: event.icon,
            image: event.image,
            updatedAt: event.updatedAt?.toISOString() || null,
            endDate: event.endDate?.toISOString() || null,
            marketProvider: event.marketProvider || null,
            tags: event.eventTags.map((et: any) => et.tag),
          },
        })) || []
      )

      // Implement proper pagination
      const totalMarkets = trendingMarkets.length
      const paginatedMarkets = trendingMarkets.slice(0, input.limit)
      const hasMore = totalMarkets > input.limit

      return {
        items: paginatedMarkets,
        nextCursor: hasMore ? String(input.limit) : null,
        hasMore,
      }
    }),

  // Create market (admin only)
  create: adminProcedure
    .input(CreateMarketInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate event exists
        const event = await eventService.getEventById(prisma, input.eventId)
        if (!event) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Event not found',
          })
        }

        // Prepare market data with proper serialization
        const marketData = {
          id: crypto.randomUUID(),
          question: input.question,
          description: input.description,
          eventId: input.eventId,
          outcomes: JSON.stringify(input.outcomes),
          outcomePrices: JSON.stringify(input.outcomePrices || [0.5, 0.5]),
          volume: input.volume || 0,
          liquidity: input.liquidity || 0,
          active: input.active,
          closed: input.closed,
          endDate: input.endDate,
          image: input.image,
          category: input.category,
        }

        const market = await marketService.createMarket(prisma, marketData)
        return await marketService.getMarketByIdSerialized(prisma, market.id)
      } catch (error) {
        console.error('Create market error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create market',
          cause: error,
        })
      }
    }),

  // Update market (admin only)
  update: adminProcedure
    .input(UpdateMarketInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, outcomes, ...updateData } = input
        
        // Prepare update data with proper serialization
        const marketData = {
          ...updateData,
          ...(outcomes && { outcomes: JSON.stringify(outcomes) }),
          updatedAt: new Date(),
        }

        const market = await marketService.updateMarket(prisma, id, marketData)
        if (!market) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Market not found',
          })
        }

        return await marketService.getMarketByIdSerialized(prisma, market.id)
      } catch (error) {
        console.error('Update market error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update market',
          cause: error,
        })
      }
    }),

  // Delete market (admin only)
  delete: adminProcedure
    .input(DeleteMarketInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await marketService.deleteMarket(prisma, input.id)
        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Market not found',
          })
        }

        return { success: true, message: 'Market deleted' }
      } catch (error) {
        console.error('Delete market error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete market',
          cause: error,
        })
      }
    }),
})