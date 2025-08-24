/**
 * Users tRPC router - Phase 7C implementation
 * Implements user profile and credit management functionality
 * Uses new service layer pattern with proper DTOs
 */

import { router, publicProcedure, authenticatedProcedure, adminProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/db/prisma'
import * as userService from '@/lib/services/user-service'
import {
  GetUserByIdInput,
  GetUserCreditsInput,
  UpdateUserCreditsInput,
  ResetUserDailyCreditsInput,
  GetUsersWithLowCreditsInput,
  GetCreditStatsInput,
} from '../schemas/user'

export const usersRouter = router({
  // Get user by ID (public for basic profile info)
  getById: publicProcedure
    .input(GetUserByIdInput)
    .query(async ({ input }) => {
      const user = await userService.getUserByIdSerialized(prisma, input.id)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }
      return user
    }),

  // Get current user's credits (authenticated users only)
  getCredits: authenticatedProcedure
    .input(GetUserCreditsInput)
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      const credits = await userService.getUserCredits(prisma, ctx.userId)
      if (!credits) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return {
        success: true,
        isAuthenticated: true,
        credits,
      }
    }),

  // Get current user profile (authenticated users only)
  getProfile: authenticatedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      const user = await userService.getUserByIdSerialized(prisma, ctx.userId)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return user
    }),

  // Update user credits (admin only)
  updateCredits: adminProcedure
    .input(UpdateUserCreditsInput)
    .mutation(async ({ input }) => {
      try {
        const user = await userService.updateUserCredits(
          prisma,
          input.userId,
          input.credits,
          input.totalCreditsEarned,
          input.totalCreditsSpent
        )

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        return {
          success: true,
          message: 'User credits updated successfully',
          user,
        }
      } catch (error) {
        console.error('Update user credits error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user credits',
          cause: error,
        })
      }
    }),

  // Reset daily credits (admin only)
  resetDailyCredits: adminProcedure
    .input(ResetUserDailyCreditsInput)
    .mutation(async ({ input }) => {
      try {
        const user = await userService.resetUserDailyCredits(
          prisma,
          input.userId,
          input.minCredits
        )

        return {
          success: true,
          message: 'Daily credits reset successfully',
          user,
        }
      } catch (error) {
        console.error('Reset daily credits error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset daily credits',
          cause: error,
        })
      }
    }),

  // Get users with low credits (admin only)
  getUsersWithLowCredits: adminProcedure
    .input(GetUsersWithLowCreditsInput)
    .query(async ({ input }) => {
      const users = await userService.getUsersWithLowCredits(prisma, input.threshold)
      return {
        success: true,
        users,
        threshold: input.threshold,
      }
    }),

  // Get credit statistics (admin only)
  getCreditStats: adminProcedure
    .input(GetCreditStatsInput)
    .query(async () => {
      const stats = await userService.getCreditStats(prisma)
      return {
        success: true,
        stats,
      }
    }),
})