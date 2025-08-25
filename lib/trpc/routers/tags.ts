/**
 * Tags tRPC router - Phase 7D implementation  
 * Implements tag listing and popular tags functionality
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as tagService from '@/lib/services/tag-service'
import {
  GetAllTagsInput,
  GetPopularTagsInput,
  GetTagsByEventIdInput,
} from '../schemas/tag'

export const tagsRouter = router({
  // Get all tags
  getAll: publicProcedure
    .input(GetAllTagsInput)
    .query(async () => {
      const tags = await tagService.getAllTags(prisma)
      return {
        success: true,
        data: tags,
      }
    }),

  // Get popular tags by market volume 
  getPopular: publicProcedure
    .input(GetPopularTagsInput)
    .query(async ({ input }) => {
      const tags = await tagService.getPopularTagsByMarketVolume(prisma, input.limit)
      return {
        success: true,
        data: tags,
      }
    }),

  // Get tags by event ID
  getByEventId: publicProcedure
    .input(GetTagsByEventIdInput)
    .query(async ({ input }) => {
      const tags = await tagService.getTagsByEventId(prisma, input.eventId)
      return {
        success: true,
        data: tags,
      }
    }),
})