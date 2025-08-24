/**
 * Main tRPC application router
 * This combines all the individual routers into a single app router
 */

import { router } from '../trpc'
import { marketsRouter } from './markets'
import { eventsRouter } from './events'
import { predictionsRouter } from './predictions'

// Main application router - combines all sub-routers
export const appRouter = router({
  markets: marketsRouter,
  events: eventsRouter,
  predictions: predictionsRouter,
  // Future routers will be added here:
  // users: usersRouter,
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter