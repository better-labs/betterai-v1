/**
 * Inngest Functions Registry
 * Centralizes all Inngest function imports following best practices
 */

export { dailyBatchPredictions } from './functions/batch-predictions'
export { 
  polymarketDataUpdate, 
  polymarketUpdateActiveEvents
} from './functions/polymarket-data-update'
export { polymarketDataUpdate6Month } from './functions/polymarket-data-update-6month'
export { predictionCheck } from './functions/prediction-check'
export { updateAIModelsWeekly } from './functions/update-ai-models'
export { 
  predictionSessionProcessor, 
  manualSessionRecovery,
  scheduledSessionRecovery
} from './functions/prediction-sessions'