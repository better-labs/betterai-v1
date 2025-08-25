/**
 * Zod input schemas for Leaderboard API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// Get AI model leaderboard
export const GetLeaderboardInput = z.object({
  tag: z.string().optional(), // Optional tag filter
})