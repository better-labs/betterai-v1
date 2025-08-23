import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../server'
import { 
  marketSearchSchema,
  marketCreateSchema,
  marketUpdateSchema,
  marketDeleteSchema,
  marketSchema,
  marketTrendingResponseSchema
} from '../schemas/market'
import { 
  searchMarkets,
  getTrendingMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
  getMarketById
} from '@/lib/services/markets'
import { paginatedResponseSchema } from '../schemas/common'

export const marketsRouter = router({
  // Search markets with filters
  search: publicProcedure
    .input(marketSearchSchema)
    .output(paginatedResponseSchema(z.array(marketSchema)))
    .query(async ({ ctx, input }) => {
      const markets = await searchMarkets(ctx.prisma, {
        q: input.q,
        limit: input.limit,
        active: input.active,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      })
      
      return {
        success: true,
        data: {
          items: markets,
          totalCount: markets.length,
          page: input.page,
          totalPages: Math.ceil(markets.length / input.limit),
          hasMore: markets.length === input.limit,
        },
      }
    }),

  // Get single market by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(z.object({
      success: z.boolean(),
      data: marketSchema.nullable(),
      message: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const market = await getMarketById(ctx.prisma, input.id)
      
      return {
        success: true,
        data: market,
        message: market ? undefined : 'Market not found',
      }
    }),

  // Get trending markets
  trending: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .output(marketTrendingResponseSchema)
    .query(async ({ ctx, input }) => {
      const markets = await getTrendingMarkets(ctx.prisma, input?.limit)
      
      return {
        success: true,
        data: markets,
      }
    }),

  // Create new market (protected)
  create: protectedProcedure
    .input(marketCreateSchema)
    .output(z.object({
      success: z.boolean(),
      data: marketSchema,
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const market = await createMarket(ctx.prisma, input)
      
      return {
        success: true,
        data: market,
        message: 'Market created successfully',
      }
    }),

  // Update market (protected)
  update: protectedProcedure
    .input(marketUpdateSchema)
    .output(z.object({
      success: z.boolean(),
      data: marketSchema.nullable(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      const market = await updateMarket(ctx.prisma, id, updateData)
      
      if (!market) {
        return {
          success: false,
          data: null,
          message: 'Market not found',
        }
      }
      
      return {
        success: true,
        data: market,
        message: 'Market updated successfully',
      }
    }),

  // Delete market (protected)  
  delete: protectedProcedure
    .input(marketDeleteSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteMarket(ctx.prisma, input.id)
      
      return {
        success: deleted,
        message: deleted ? 'Market deleted successfully' : 'Market not found',
      }
    }),
})