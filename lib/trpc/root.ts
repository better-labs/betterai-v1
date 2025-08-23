import { router } from './server'
import { marketsRouter } from './routers/markets'

export const appRouter = router({
  markets: marketsRouter,
})

export type AppRouter = typeof appRouter