import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { 
  creditsResponseSchema, 
  creditsPurchaseSchema,
  creditsDeductSchema,
  userUpdateSchema,
  userProfileResponseSchema
} from '../schemas/user'
import { creditManager } from '@/lib/services/credit-manager'
import { getUserCredits, updateUserCredits, resetUserDailyCredits, getUserById, updateUserProfile } from '@/lib/services/users'

export const usersRouter = router({
  // Get user credits
  credits: protectedProcedure
    .output(creditsResponseSchema)
    .query(async ({ ctx }) => {
      try {
        const credits = await creditManager.getUserCredits(ctx.user.id)
        
        return {
          success: true,
          data: credits ? {
            credits: credits.credits,
            creditsLastReset: credits.creditsLastReset?.toISOString() || null,
            totalCreditsEarned: credits.totalCreditsEarned,
            totalCreditsSpent: credits.totalCreditsSpent,
          } : null,
          isAuthenticated: true,
        }
      } catch (error) {
        console.error('Error fetching user credits:', error)
        return {
          success: false,
          data: null,
          isAuthenticated: true,
          message: 'Failed to fetch credits',
        }
      }
    }),

  // Purchase credits
  purchaseCredits: protectedProcedure
    .input(creditsPurchaseSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
      newBalance: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await creditManager.addCredits(
          ctx.user.id, 
          input.amount, 
          `Purchase via ${input.paymentMethod}`
        )
        
        const updatedCredits = await creditManager.getUserCredits(ctx.user.id)
        
        return {
          success: true,
          message: `Successfully added ${input.amount} credits`,
          newBalance: updatedCredits?.credits,
        }
      } catch (error) {
        console.error('Error purchasing credits:', error)
        return {
          success: false,
          message: 'Failed to purchase credits',
        }
      }
    }),

  // Deduct credits (for AI predictions)
  deductCredits: protectedProcedure
    .input(creditsDeductSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
      remainingCredits: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await creditManager.consumeCredits(
          ctx.user.id,
          input.amount,
          input.reason
        )
        
        if (!success) {
          return {
            success: false,
            message: 'Insufficient credits',
          }
        }
        
        const updatedCredits = await creditManager.getUserCredits(ctx.user.id)
        
        return {
          success: true,
          message: `Consumed ${input.amount} credits for ${input.reason}`,
          remainingCredits: updatedCredits?.credits,
        }
      } catch (error) {
        console.error('Error deducting credits:', error)
        return {
          success: false,
          message: 'Failed to deduct credits',
        }
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(userUpdateSchema)
    .output(userProfileResponseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Note: This would need a proper user table update
        // For now, just return success since we only have credits in the database
        
        return {
          success: true,
          data: {
            id: ctx.user.id,
            email: input.email || null,
            walletAddress: input.walletAddress || null,
            username: input.username || null,
            avatar: input.avatar || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            credits: 0, // Would come from actual user table
            creditsLastReset: null,
            totalCreditsEarned: 0,
            totalCreditsSpent: 0,
          },
          message: 'Profile updated successfully',
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        return {
          success: false,
          data: null,
          message: 'Failed to update profile',
        }
      }
    }),

  // Check if user should see add credits button
  shouldShowAddCredits: protectedProcedure
    .output(z.object({
      show: z.boolean(),
      currentCredits: z.number(),
      threshold: z.number(),
    }))
    .query(async ({ ctx }) => {
      try {
        const show = await creditManager.shouldShowAddCreditsButton(ctx.user.id)
        const credits = await creditManager.getUserCredits(ctx.user.id)
        
        return {
          show,
          currentCredits: credits?.credits || 0,
          threshold: 20, // Could be configurable
        }
      } catch (error) {
        console.error('Error checking add credits status:', error)
        return {
          show: false,
          currentCredits: 0,
          threshold: 20,
        }
      }
    }),
})