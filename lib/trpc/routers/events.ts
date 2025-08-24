/**
 * Events tRPC router - Phase 5B implementation
 * Implements event listings with market relationships and category-based filtering
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure, authenticatedProcedure, adminProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as eventService from '@/lib/services/event-service'
import {
  GetEventsInput,
  GetEventByIdInput,
  SearchEventsInput,
  GetEventsByCategoryInput,
  GetCategoryStatsInput,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventInput,
  convertZodCategoryToPrisma,
} from '../schemas/event'

export const eventsRouter = router({
  // Single event query by ID
  getById: publicProcedure
    .input(GetEventByIdInput)
    .query(async ({ input }) => {
      const event = await eventService.getEventByIdSerialized(prisma, input.id)
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        })
      }
      return event
    }),

  // List events with various filters (main endpoint)
  list: publicProcedure
    .input(GetEventsInput)
    .query(async ({ input }) => {
      // Single event by ID
      if (input.id) {
        const event = await eventService.getEventByIdSerialized(prisma, input.id)
        if (!event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Event not found',
          })
        }
        return {
          items: [event],
          nextCursor: null,
          hasMore: false,
        }
      }

      // Search functionality
      if (input.search) {
        const events = await eventService.searchEvents(prisma, input.search, {
          limit: input.limit,
          includeMarkets: input.includeMarkets,
        })

        // Convert to DTOs if they aren't already
        const eventDTOs = events.map(event => {
          const baseEvent = {
            ...event,
            volume: event.volume?.toString() || '0',
            endDate: event.endDate?.toISOString() || null,
            startDate: event.startDate?.toISOString() || null,
            updatedAt: event.updatedAt?.toISOString() || null,
          }
          
          // Handle markets if included
          if (input.includeMarkets && 'markets' in event && event.markets) {
            return {
              ...baseEvent,
              markets: (event.markets as any[]).map((market: any) => ({
                ...market,
                volume: market.volume?.toString() || '0',
                liquidity: market.liquidity?.toString() || '0',
                outcomePrices: Array.isArray(market.outcomePrices) 
                  ? market.outcomePrices.map((price: any) => 
                      typeof price === 'string' ? parseFloat(price) : Number(price)
                    )
                  : [],
              }))
            }
          }
          
          return baseEvent
        })

        return {
          items: eventDTOs,
          nextCursor: null,
          hasMore: false,
        }
      }

      // Category filtering
      if (input.category) {
        const prismaCategory = convertZodCategoryToPrisma(input.category)
        let events
        
        if (input.includeMarkets) {
          events = await eventService.getEventsByCategoryWithMarkets(prisma, prismaCategory)
        } else {
          events = await eventService.getEventsByCategory(prisma, prismaCategory)
        }

        // Convert to DTOs
        const eventDTOs = events.map(event => {
          const baseEvent = {
            ...event,
            volume: event.volume?.toString() || '0',
            endDate: event.endDate?.toISOString() || null,
            startDate: event.startDate?.toISOString() || null,
            updatedAt: event.updatedAt?.toISOString() || null,
          }
          
          // Handle markets if included
          if (input.includeMarkets && 'markets' in event && event.markets) {
            return {
              ...baseEvent,
              markets: (event.markets as any[]).map((market: any) => ({
                ...market,
                volume: market.volume?.toString() || '0',
                liquidity: market.liquidity?.toString() || '0',
                outcomePrices: Array.isArray(market.outcomePrices) 
                  ? market.outcomePrices.map((price: any) => 
                      typeof price === 'string' ? parseFloat(price) : Number(price)
                    )
                  : [],
              }))
            }
          }
          
          return baseEvent
        })

        return {
          items: eventDTOs,
          nextCursor: null,
          hasMore: false,
        }
      }

      // Default: get top events by volume
      const events = await eventService.getTopEvents(prisma, input.limit)
      const eventDTOs = events.map(event => ({
        ...event,
        volume: event.volume?.toString() || '0',
        endDate: event.endDate?.toISOString() || null,
        startDate: event.startDate?.toISOString() || null,
        updatedAt: event.updatedAt?.toISOString() || null,
      }))

      return {
        items: eventDTOs,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Search events (dedicated search endpoint)
  search: publicProcedure
    .input(SearchEventsInput)
    .query(async ({ input }) => {
      const events = await eventService.searchEvents(prisma, input.query, {
        limit: input.limit,
        includeMarkets: input.includeMarkets,
      })

      // Filter by category if specified
      const filteredEvents = input.category 
        ? events.filter(event => event.category === input.category)
        : events

      // Convert to DTOs
      const eventDTOs = filteredEvents.map(event => {
        const baseEvent = {
          ...event,
          volume: event.volume?.toString() || '0',
          endDate: event.endDate?.toISOString() || null,
          startDate: event.startDate?.toISOString() || null,
          updatedAt: event.updatedAt?.toISOString() || null,
        }
        
        // Handle markets if included
        if (input.includeMarkets && event.markets) {
          return {
            ...baseEvent,
            markets: (event.markets as any[]).map((market: any) => ({
              ...market,
              volume: market.volume?.toString() || '0',
              liquidity: market.liquidity?.toString() || '0',
              outcomePrices: Array.isArray(market.outcomePrices) 
                ? market.outcomePrices.map((price: any) => 
                    typeof price === 'string' ? parseFloat(price) : Number(price)
                  )
                : [],
            }))
          }
        }
        
        return baseEvent
      })

      return {
        items: eventDTOs,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Get events by category (dedicated endpoint)
  byCategory: publicProcedure
    .input(GetEventsByCategoryInput)
    .query(async ({ input }) => {
      const prismaCategory = convertZodCategoryToPrisma(input.category)
      let events
      
      if (input.includeMarkets) {
        events = await eventService.getEventsByCategoryWithMarkets(prisma, prismaCategory)
      } else {
        events = await eventService.getEventsByCategory(prisma, prismaCategory)
      }

      // Convert to DTOs
      const eventDTOs = events.map(event => {
        const baseEvent = {
          ...event,
          volume: event.volume?.toString() || '0',
          endDate: event.endDate?.toISOString() || null,
          startDate: event.startDate?.toISOString() || null,
          updatedAt: event.updatedAt?.toISOString() || null,
        }
        
        // Handle markets if included
        if (input.includeMarkets && 'markets' in event && event.markets) {
          return {
            ...baseEvent,
            markets: (event.markets as any[]).map((market: any) => ({
              ...market,
              volume: market.volume?.toString() || '0',
              liquidity: market.liquidity?.toString() || '0',
              outcomePrices: Array.isArray(market.outcomePrices) 
                ? market.outcomePrices.map((price: any) => 
                    typeof price === 'string' ? parseFloat(price) : Number(price)
                  )
                : [],
            }))
          }
        }
        
        return baseEvent
      })

      return {
        items: eventDTOs,
        nextCursor: null,
        hasMore: false,
      }
    }),

  // Get category statistics
  categoryStats: publicProcedure
    .input(GetCategoryStatsInput)
    .query(async ({ input }) => {
      return await eventService.getCategoryStats(prisma)
    }),

  // Create event (admin only)
  create: adminProcedure
    .input(CreateEventInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // Prepare event data with proper type conversion
        const eventData = {
          id: input.id || crypto.randomUUID(),
          title: input.title,
          description: input.description || null,
          slug: input.slug || null,
          icon: input.icon || null,
          image: input.image || null,
          category: input.category ? convertZodCategoryToPrisma(input.category) : null,
          providerCategory: input.providerCategory || null,
          volume: input.volume || 0,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          marketProvider: input.marketProvider || null,
          tags: input.tags || null,
        }

        const event = await eventService.createEvent(prisma, eventData)
        return await eventService.getEventByIdSerialized(prisma, event.id)
      } catch (error) {
        console.error('Create event error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create event',
          cause: error,
        })
      }
    }),

  // Update event (admin only)
  update: adminProcedure
    .input(UpdateEventInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateFields } = input
        
        // Prepare update data with proper type conversion
        const eventData = {
          ...(updateFields.title && { title: updateFields.title }),
          ...(updateFields.description !== undefined && { description: updateFields.description }),
          ...(updateFields.slug !== undefined && { slug: updateFields.slug }),
          ...(updateFields.icon !== undefined && { icon: updateFields.icon }),
          ...(updateFields.image !== undefined && { image: updateFields.image }),
          ...(updateFields.category && { category: convertZodCategoryToPrisma(updateFields.category) }),
          ...(updateFields.providerCategory !== undefined && { providerCategory: updateFields.providerCategory }),
          ...(updateFields.volume !== undefined && { volume: updateFields.volume }),
          ...(updateFields.startDate && { startDate: new Date(updateFields.startDate) }),
          ...(updateFields.endDate && { endDate: new Date(updateFields.endDate) }),
          ...(updateFields.marketProvider !== undefined && { marketProvider: updateFields.marketProvider }),
          ...(updateFields.tags !== undefined && { tags: updateFields.tags }),
          updatedAt: new Date(),
        }

        const event = await eventService.updateEvent(prisma, id, eventData)
        if (!event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Event not found',
          })
        }

        return await eventService.getEventByIdSerialized(prisma, event.id)
      } catch (error) {
        console.error('Update event error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update event',
          cause: error,
        })
      }
    }),

  // Delete event (admin only)
  delete: adminProcedure
    .input(DeleteEventInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await eventService.deleteEvent(prisma, input.id)
        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Event not found',
          })
        }

        return { success: true, message: 'Event deleted' }
      } catch (error) {
        console.error('Delete event error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete event',
          cause: error,
        })
      }
    }),
})