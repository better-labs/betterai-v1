import { router } from './server'
import { marketsRouter } from './routers/markets'
import { eventsRouter } from './routers/events'
import { predictionsRouter } from './routers/predictions'
import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  markets: marketsRouter,
  events: eventsRouter,
  predictions: predictionsRouter,
})

export type AppRouter = typeof appRouter