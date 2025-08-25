/**
 * Zod input schemas for Users API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// Get user by ID
export const GetUserByIdInput = z.object({
  id: z.string().min(1, 'User ID is required'),
})

// Get user credits
export const GetUserCreditsInput = z.object({
  // No additional input needed - uses authenticated user context
})

// Update user credits (admin only)
export const UpdateUserCreditsInput = z.object({
  userId: z.string().min(1, 'User ID is required'),
  credits: z.number().int().min(0, 'Credits must be non-negative'),
  totalCreditsEarned: z.number().int().min(0).optional(),
  totalCreditsSpent: z.number().int().min(0).optional(),
})

// Reset daily credits (admin only) 
export const ResetUserDailyCreditsInput = z.object({
  userId: z.string().min(1, 'User ID is required'),
  minCredits: z.number().int().min(0).optional().default(100),
})

// Get users with low credits (admin only)
export const GetUsersWithLowCreditsInput = z.object({
  threshold: z.number().int().min(0).optional().default(10),
})

// Get credit stats (admin only)
export const GetCreditStatsInput = z.object({
  // No additional input needed
})