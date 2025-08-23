import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../server'
import { userSchema, userProfileResponseSchema } from '../schemas/user'
import { getUserCredits, getUserById } from '@/lib/services/users'

export const authRouter = router({
  // Public endpoint - check auth status without requiring authentication
  status: publicProcedure
    .output(z.object({
      isAuthenticated: z.boolean(),
      user: userSchema.nullable(),
    }))
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return {
          isAuthenticated: false,
          user: null,
        }
      }

      try {
        // Fetch user details from database
        const userCredits = await getUserCredits(ctx.prisma, ctx.user.id)
        
        if (!userCredits) {
          return {
            isAuthenticated: true,
            user: null, // User authenticated but not in database
          }
        }

        return {
          isAuthenticated: true,
          user: {
            id: ctx.user.id,
            email: null, // Will be populated from actual user table
            walletAddress: null,
            username: null,
            avatar: null,
            createdAt: null,
            updatedAt: null,
            credits: userCredits.credits,
            creditsLastReset: userCredits.creditsLastReset?.toISOString() || null,
            totalCreditsEarned: userCredits.totalCreditsEarned,
            totalCreditsSpent: userCredits.totalCreditsSpent,
          },
        }
      } catch (error) {
        console.error('Error fetching user in auth status:', error)
        return {
          isAuthenticated: true,
          user: null,
        }
      }
    }),

  // Protected endpoint - get current user profile
  profile: protectedProcedure
    .output(userProfileResponseSchema)
    .query(async ({ ctx }) => {
      try {
        const userCredits = await getUserCredits(ctx.prisma, ctx.user.id)
        
        if (!userCredits) {
          return {
            success: false,
            data: null,
            message: 'User profile not found',
          }
        }

        return {
          success: true,
          data: {
            id: ctx.user.id,
            email: null, // Will be populated from actual user table
            walletAddress: null,
            username: null,
            avatar: null,
            createdAt: null,
            updatedAt: null,
            credits: userCredits.credits,
            creditsLastReset: userCredits.creditsLastReset?.toISOString() || null,
            totalCreditsEarned: userCredits.totalCreditsEarned,
            totalCreditsSpent: userCredits.totalCreditsSpent,
          },
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        return {
          success: false,
          data: null,
          message: 'Failed to fetch user profile',
        }
      }
    }),

  // Test endpoint to verify protected procedure works
  protected: protectedProcedure
    .output(z.object({
      message: z.string(),
      userId: z.string(),
      timestamp: z.string(),
    }))
    .query(({ ctx }) => ({
      message: 'You are authenticated!',
      userId: ctx.user.id,
      timestamp: new Date().toISOString(),
    })),
})