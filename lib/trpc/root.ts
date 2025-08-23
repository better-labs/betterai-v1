import { router } from './server'
import { marketsRouter } from './routers/markets'
import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  markets: marketsRouter,
})

export type AppRouter = typeof appRouter