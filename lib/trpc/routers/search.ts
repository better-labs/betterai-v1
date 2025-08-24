/**
 * Search tRPC router - Phase 7B implementation
 * Implements unified search across markets, events, and tags
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/db/prisma'
import * as searchService from '@/lib/services/search-service'
import { SearchAllInput } from '../schemas/search'

export const searchRouter = router({
  // Search all content types (markets, events, tags)
  searchAll: publicProcedure
    .input(SearchAllInput)
    .query(async ({ input }) => {
      const results = await searchService.searchAll(prisma, input.q, {
        includeMarkets: input.includeMarkets,
        includeEvents: input.includeEvents,
        includeTags: input.includeTags,
        limit: input.limit,
        marketOptions: {
          sort: input.marketSort,
          status: input.marketStatus,
        },
      })

      return {
        success: true,
        query: input.q,
        results: {
          markets: results.markets,
          events: results.events,
          tags: results.tags,
          totalResults: results.totalResults,
          suggestions: results.suggestions,
        },
      }
    }),
})