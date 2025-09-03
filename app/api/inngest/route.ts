/**
 * Inngest Webhook Handler for Vercel
 * This endpoint receives webhooks from Inngest to execute scheduled and event-driven functions
 */

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { dailyBatchPredictions } from '@/lib/inngest/functions/batch-predictions'

// Configure the Inngest serve handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Phase 1: Native scheduled functions
    dailyBatchPredictions,
    
    // Phase 2: Additional cron functions will be added here
    // Phase 3: Event-driven session functions will be added here
  ],
  // Serve configuration
  streaming: true, // Enable streaming for better performance
})