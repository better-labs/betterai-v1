import { z } from 'zod'

// Base user schema matching Prisma model
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  walletAddress: z.string().nullable(),
  username: z.string().nullable(),
  avatar: z.string().url().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  credits: z.number().int().min(0),
  creditsLastReset: z.string().nullable(),
  totalCreditsEarned: z.number().int().min(0),
  totalCreditsSpent: z.number().int().min(0),
})

// Input schemas
export const userCreateSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  username: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
})

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(), 
  username: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
})

// Credits management schemas
export const creditsSchema = z.object({
  credits: z.number().int().min(0),
  creditsLastReset: z.string().nullable(),
  totalCreditsEarned: z.number().int().min(0),
  totalCreditsSpent: z.number().int().min(0),
})

export const creditsPurchaseSchema = z.object({
  amount: z.number().int().min(1).max(10000),
  paymentMethod: z.enum(['stripe', 'crypto']),
})

export const creditsDeductSchema = z.object({
  amount: z.number().int().min(1),
  reason: z.string().min(1).max(200),
})

// Response schemas
export const userProfileResponseSchema = z.object({
  success: z.boolean(),
  data: userSchema.nullable(),
  message: z.string().optional(),
})

export const creditsResponseSchema = z.object({
  success: z.boolean(),
  data: creditsSchema.nullable(),
  isAuthenticated: z.boolean(),
  message: z.string().optional(),
})