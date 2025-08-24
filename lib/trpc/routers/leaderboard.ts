/**
 * Leaderboard tRPC router - Phase 7A implementation
 * Implements AI model leaderboard functionality
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/db/prisma'
import * as leaderboardService from '@/lib/services/leaderboard-service'
import { GetLeaderboardInput } from '../schemas/leaderboard'

export const leaderboardRouter = router({
  // Get AI model leaderboard
  getLeaderboard: publicProcedure
    .input(GetLeaderboardInput)
    .query(async ({ input }) => {
      const leaderboard = input.tag
        ? await leaderboardService.getAIModelLeaderboardByTag(prisma, input.tag)
        : await leaderboardService.getAIModelLeaderboard(prisma)

      return {
        success: true,
        data: {
          leaderboard,
          tag: input.tag || null,
        },
      }
    }),
})