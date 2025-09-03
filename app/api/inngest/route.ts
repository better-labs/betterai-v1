/**
 * Inngest Webhook Handler for Vercel
 * This endpoint receives webhooks from Inngest to execute scheduled and event-driven functions
 * 
 * Following Inngest best practices:
 * - Centralized function registry
 * - Clean separation of concerns
 * - Scalable function organization
 */

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { dailyBatchPredictions } from '@/lib/inngest/functions'

// Configure the Inngest serve handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Phase 1: Scheduled functions
    dailyBatchPredictions,
    
    // Phase 2: Additional scheduled functions will be added here
    // Phase 3: Event-driven functions will be added here
  ],
})