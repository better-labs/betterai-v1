import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../server'
import { 
  marketSearchSchema,
  marketCreateSchema,
  marketUpdateSchema,
  marketDeleteSchema,
  marketSchema,
  marketListResponseSchema
} from '../schemas/market'
import { getMarkets, createMarket, updateMarket, deleteMarket } from '@/lib/db/queries/market'
import { serializeDecimals } from '@/lib/serialization'

export const marketsRouter = router({
  list: publicProcedure
    .input(marketSearchSchema)
    .output(marketListResponseSchema)
    .query(async ({ input }) => {
      try {
        const markets = await getMarkets(input)
        const serializedMarkets = serializeDecimals(markets)
        
        return {
          success: true,
          data: {
            markets: serializedMarkets,
            totalCount: markets.length,
            page: input.page,
            totalPages: Math.ceil(markets.length / input.limit),
          },
        }
      } catch (error) {
        throw new Error(`Failed to fetch markets: ${error}`)
      }
    }),

  trending: publicProcedure
    .output(z.object({
      success: z.boolean(),
      data: z.array(marketSchema),
      message: z.string().optional(),
    }))
    .query(async () => {
      try {
        // Reuse existing trending logic from current API
        const markets = await getMarkets({ 
          limit: 10, 
          sortBy: 'volume' as const,
          sortOrder: 'desc' as const,
          active: true
        })
        const serializedMarkets = serializeDecimals(markets)
        
        return {
          success: true,
          data: serializedMarkets,
        }
      } catch (error) {
        throw new Error(`Failed to fetch trending markets: ${error}`)
      }
    }),

  create: protectedProcedure
    .input(marketCreateSchema)
    .output(z.object({
      success: z.boolean(),
      data: marketSchema,
      message: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const market = await createMarket(input, ctx.user.id)
        const serializedMarket = serializeDecimals(market)
        
        return {
          success: true,
          data: serializedMarket,
          message: 'Market created successfully',
        }
      } catch (error) {
        throw new Error(`Failed to create market: ${error}`)
      }
    }),

  update: protectedProcedure
    .input(marketUpdateSchema)
    .output(z.object({
      success: z.boolean(),
      data: marketSchema,
      message: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const market = await updateMarket(input, ctx.user.id)
        const serializedMarket = serializeDecimals(market)
        
        return {
          success: true,
          data: serializedMarket,
          message: 'Market updated successfully',
        }
      } catch (error) {
        throw new Error(`Failed to update market: ${error}`)
      }
    }),

  delete: protectedProcedure
    .input(marketDeleteSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteMarket(input.id, ctx.user.id)
        
        return {
          success: true,
          message: 'Market deleted successfully',
        }
      } catch (error) {
        throw new Error(`Failed to delete market: ${error}`)
      }
    }),
})