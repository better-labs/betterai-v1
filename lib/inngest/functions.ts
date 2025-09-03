/**
 * Inngest Functions Registry
 * Centralizes all Inngest function imports following best practices
 */

export { dailyBatchPredictions } from './functions/batch-predictions'
export { 
  polymarketDataUpdate, 
  polymarketDataUpdateExtended,
  polymarketUpdateActiveEvents
} from './functions/polymarket-data-update'
export { predictionCheck } from './functions/prediction-check'
export { sessionRecovery } from './functions/session-recovery'
export { updateAIModelsWeekly } from './functions/update-ai-models'
export { 
  predictionSessionProcessor, 
  predictionSessionRecovery 
} from './functions/prediction-sessions'