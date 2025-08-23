// Re-export all query modules for backward compatibility
export { aiModelQueries, DEFAULT_MODEL } from './ai-model'
export { eventQueries } from './event'
export { tagQueries } from './tag'
export { marketQueries } from './market'
export { predictionQueries } from './prediction'
export { researchCacheQueries } from './research-cache'
export { predictionCheckQueries } from './prediction-check'
export { userQueries, userWatchlistQueries } from './user'
export { leaderboardQueries } from './leaderboard'
export { searchQueries } from './search'
export { experimentQueries } from './experiment'

// Re-export types for backward compatibility
export type { 
  AiModel as NewAIModel, 
  Event as NewEvent, 
  Prediction as NewPrediction, 
  Market as NewMarket, 
  ResearchCache as NewResearchCache, 
  PredictionCheck as NewPredictionCheck, 
  User as NewUser, 
  UserWatchlist as NewUserWatchlist 
} from '../../../lib/generated/prisma'