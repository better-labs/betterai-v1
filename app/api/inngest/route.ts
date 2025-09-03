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
  polymarketUpdateActiveEvents,
  predictionCheck,
  updateAIModelsWeekly,
  
  // Phase 3: Real-time prediction flow (NEW)
  predictionSessionProcessor,
  manualSessionRecovery,
  scheduledSessionRecovery
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
    polymarketUpdateActiveEvents,   // Every 12 hours
    predictionCheck,                // Daily at 3:30 AM
    updateAIModelsWeekly,           // Weekly Sunday 4 AM
    
    // Phase 3: Real-time prediction flow (COMPLETE)
    predictionSessionProcessor,     // Event: prediction.session.requested
    manualSessionRecovery,          // Event: prediction.session.recovery
    scheduledSessionRecovery,       // Cron: Every 15 minutes
  ],
})