/**
 * Inngest Functions Registry
 * Centralizes all Inngest function imports following best practices
 */

// Import all scheduled functions
export { dailyBatchPredictions } from './functions/batch-predictions'

// Future imports will be added here as we migrate more functions
// export { dailyUpdatePolymarketData } from './functions/polymarket-data'
// export { predictionCheck } from './functions/prediction-check'
// etc...