/**
 * Main tRPC application router
 * This combines all the individual routers into a single app router
 */

import { router } from '../trpc'
import { marketsRouter } from './markets'

// Main application router - combines all sub-routers
export const appRouter = router({
  markets: marketsRouter,
  // Future routers will be added here:
  // events: eventsRouter,
  // predictions: predictionsRouter,
  // users: usersRouter,
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter