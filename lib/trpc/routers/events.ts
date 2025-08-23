import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../server'
import {
  eventSearchSchema,
  eventCreateSchema,
  eventUpdateSchema,
  eventDeleteSchema,
} from '../schemas/event'
import {
  searchEvents,
  getTrendingEvents,
  getEventById,
  getEventsByCategory,
  createEvent,
  updateEvent,
  deleteEvent
} from '@/lib/services/events'

export const eventsRouter = router({
  // Search events with filters
  search: publicProcedure
    .input(eventSearchSchema)
    .query(async ({ ctx, input }) => {
      const events = await searchEvents(ctx.prisma, {
        q: input.q,
        category: input.category as any, // Convert Zod enum to Prisma enum
        provider: input.provider,
        active: input.active,
        limit: input.limit,
        page: input.page,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      })
      
      const totalCount = events.length // Simplified for now
      const totalPages = Math.ceil(totalCount / input.limit)
      
      return {
        success: true,
        data: {
          items: events,
          totalCount,
          page: input.page,
          totalPages,
          hasMore: input.page < totalPages,
        },
      }
    }),

  // Get single event by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await getEventById(ctx.prisma, input.id)
      
      return {
        success: true,
        data: event,
        message: event ? undefined : 'Event not found',
      }
    }),

  // Get trending events
  trending: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const events = await getTrendingEvents(ctx.prisma, input?.limit)
      
      return {
        success: true,
        data: events,
      }
    }),

  // Get events by category
  byCategory: publicProcedure
    .input(z.object({ 
      category: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const events = await getEventsByCategory(
        ctx.prisma, 
        input.category as any, // Convert string to Category enum
        input.limit
      )
      
      return {
        success: true,
        data: events,
      }
    }),

  // Create new event (admin only)
  create: adminProcedure
    .input(eventCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const event = await createEvent(ctx.prisma, {
        ...input,
        category: input.category as any, // Convert Zod enum to Prisma enum
      })
      
      return {
        success: true,
        data: event,
        message: 'Event created successfully',
      }
    }),

  // Update event (admin only)
  update: adminProcedure
    .input(eventUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      const event = await updateEvent(ctx.prisma, id, {
        ...updateData,
        category: updateData.category as any, // Convert Zod enum to Prisma enum
      })
      
      if (!event) {
        return {
          success: false,
          data: null,
          message: 'Event not found',
        }
      }
      
      return {
        success: true,
        data: event,
        message: 'Event updated successfully',
      }
    }),

  // Delete event (admin only)  
  delete: adminProcedure
    .input(eventDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteEvent(ctx.prisma, input.id)
      
      return {
        success: deleted,
        message: deleted ? 'Event deleted successfully' : 'Event not found',
      }
    }),
})