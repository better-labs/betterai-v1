/**
 * Zod input schemas for Tags API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// Get all tags
export const GetAllTagsInput = z.object({
  // No additional input needed
})

// Get popular tags by market volume
export const GetPopularTagsInput = z.object({
  limit: z.number().int().positive().max(100).optional().default(25),
})

// Get tags by event ID
export const GetTagsByEventIdInput = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
})