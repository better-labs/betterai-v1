/**
 * Main tRPC application router
 * This combines all the individual routers into a single app router
 */

import { router } from '../trpc'
import { marketsRouter } from './markets'
import { eventsRouter } from './events'
import { predictionsRouter } from './predictions'
import { predictionSessionsRouter } from './prediction-sessions'
import { usersRouter } from './users'
import { tagsRouter } from './tags'
import { searchRouter } from './search'
import { leaderboardRouter } from './leaderboard'

// Main application router - combines all sub-routers
export const appRouter = router({
  markets: marketsRouter,
  events: eventsRouter,
  predictions: predictionsRouter,
  predictionSessions: predictionSessionsRouter,
  users: usersRouter,
  tags: tagsRouter,
  search: searchRouter,
  leaderboard: leaderboardRouter,
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter