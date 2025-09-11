/**
 * Zod input schemas for Prediction Sessions API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// Valid research source IDs
const ResearchSourceId = z.enum(['exa', 'exa-two-step', 'grok'])

// Start a new prediction session
export const StartPredictionSessionInput = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  selectedModels: z.array(z.string().min(1)).min(1, 'At least one model must be selected').max(5, 'Maximum 5 models allowed'),
  selectedResearchSources: z.array(ResearchSourceId).min(1, 'At least one research source must be selected'), // Required multiple research sources
})

// Get prediction session status
export const GetPredictionSessionStatusInput = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
})

// Get user's recent sessions for a market
export const GetUserRecentSessionsInput = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  limit: z.number().int().positive().max(10).optional().default(5),
})