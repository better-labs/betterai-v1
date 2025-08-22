/**
 * Main tRPC router
 * Combines all sub-routers into a single AppRouter
 */

import { createTRPCRouter } from './init'
import { predictionRouter } from './routers/prediction'

/**
 * This is the primary router for your server.
 * All routers added in /lib/trpc/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  prediction: predictionRouter,
  // TODO: Add other routers as we migrate them
  // market: marketRouter,
  // event: eventRouter,
  // user: userRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
