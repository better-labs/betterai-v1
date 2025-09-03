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
import {
  // Phase 1: Batch predictions (COMPLETE)
  dailyBatchPredictions,
  
  // Phase 2: All remaining cron jobs (COMPLETE)
  polymarketDataUpdate,
  polymarketDataUpdateExtended,
  predictionCheck,
  sessionRecovery,
  updateActiveEvents,
  updateAIModelsWeekly
} from '@/lib/inngest/functions'

// Configure the Inngest serve handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Phase 1: Batch predictions
    dailyBatchPredictions,
    
    // Phase 2: Complete Vercel cron elimination
    polymarketDataUpdate,           // Every 6 hours
    polymarketDataUpdateExtended,   // Daily at 2 AM (extended params)
    predictionCheck,                // Daily at 3:30 AM
    sessionRecovery,                // Every 15 minutes
    updateActiveEvents,             // Every 12 hours
    updateAIModelsWeekly,           // Weekly Sunday 4 AM
    
    // Phase 3: Event-driven functions will be added here
  ],
})