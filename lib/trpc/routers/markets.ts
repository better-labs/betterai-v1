/**
 * Markets tRPC router
 * This demonstrates how existing API endpoints can be migrated to tRPC
 * WITHOUT replacing the existing REST endpoints initially
 */

import { z } from 'zod'
import { router, publicProcedure, authenticatedProcedure, createTRPCError } from '../trpc'
import { marketQueries } from '@/lib/db/queries'
import { serializeDecimals } from '@/lib/serialization'
import type { ApiResponse } from '@/lib/types'

export const marketsRouter = router({
  // GET /api/markets equivalent
  getMarkets: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      eventId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { id, eventId } = input

        if (id) {
          const market = await marketQueries.getMarketById(id)
          if (!market) {
            throw createTRPCError(new Error('Market not found'))
          }
          return {
            success: true,
            data: serializeDecimals(market),
            timestamp: new Date().toISOString(),
          } as ApiResponse
        }

        if (eventId) {
          const markets = await marketQueries.getMarketsByEventId(eventId)
          return {
            success: true,
            data: serializeDecimals(markets),
            timestamp: new Date().toISOString(),
          } as ApiResponse
        }

        // Default: get all markets
        const markets = await marketQueries.getMarketsByEventId('')
        return {
          success: true,
          data: serializeDecimals(markets),
          timestamp: new Date().toISOString(),
        } as ApiResponse
      } catch (error) {
        throw createTRPCError(error)
      }
    }),

  // GET /api/markets/trending equivalent  
  getTrendingMarkets: publicProcedure
    .query(async () => {
      try {
        // This would implement the same logic as the trending endpoint
        const markets = await marketQueries.getMarketsByEventId('')
        return {
          success: true,
          data: serializeDecimals(markets),
          timestamp: new Date().toISOString(),
        } as ApiResponse
      } catch (error) {
        throw createTRPCError(error)
      }
    }),

  // POST /api/markets equivalent (authenticated)
  createMarket: authenticatedProcedure
    .input(z.object({
      question: z.string().min(10),
      eventId: z.string(),
      outcomes: z.array(z.string()).min(2),
      description: z.string().optional(),
      // Add other market creation fields as needed
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const marketData = {
          ...input,
          // Convert outcomes to JSON string to match existing schema
          outcomes: JSON.stringify(input.outcomes),
          outcomePrices: JSON.stringify([0.5, 0.5]), // Default 50/50 odds
          volume: '0',
          liquidity: '0',
          active: true,
          closed: false,
        }

        const market = await marketQueries.createMarket(marketData)
        return {
          success: true,
          data: serializeDecimals(market),
          timestamp: new Date().toISOString(),
        } as ApiResponse
      } catch (error) {
        throw createTRPCError(error)
      }
    }),

  // PUT /api/markets equivalent (authenticated)
  updateMarket: authenticatedProcedure
    .input(z.object({
      id: z.string(),
      question: z.string().optional(),
      description: z.string().optional(),
      outcomes: z.array(z.string()).optional(),
      active: z.boolean().optional(),
      closed: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, outcomes, ...updateData } = input
        
        const marketData = {
          ...updateData,
          // Convert outcomes to JSON string if provided
          ...(outcomes && { outcomes: JSON.stringify(outcomes) }),
        }

        const market = await marketQueries.updateMarket(id, marketData)
        if (!market) {
          throw createTRPCError(new Error('Market not found'))
        }

        return {
          success: true,
          data: serializeDecimals(market),
          timestamp: new Date().toISOString(),
        } as ApiResponse
      } catch (error) {
        throw createTRPCError(error)
      }
    }),

  // DELETE /api/markets equivalent (authenticated)
  deleteMarket: authenticatedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await marketQueries.deleteMarket(input.id)
        if (!success) {
          throw createTRPCError(new Error('Market not found'))
        }

        return {
          success: true,
          message: 'Market deleted',
          timestamp: new Date().toISOString(),
        } as ApiResponse
      } catch (error) {
        throw createTRPCError(error)
      }
    }),
})