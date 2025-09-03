/**
 * Inngest Functions Registry
 * Centralizes all Inngest function imports following best practices
 */

// Phase 1: Batch predictions (COMPLETE)
export { dailyBatchPredictions } from './functions/batch-predictions'

// Phase 2: All remaining cron jobs (COMPLETE)
export { 
  polymarketDataUpdate, 
  polymarketDataUpdateExtended 
} from './functions/polymarket-data-update'
export { predictionCheck } from './functions/prediction-check'
export { sessionRecovery } from './functions/session-recovery'
export { updateActiveEvents } from './functions/update-active-events'
export { updateAIModelsWeekly } from './functions/update-ai-models'