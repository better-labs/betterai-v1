import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import type { NextRequest } from 'next/server'
import type { PrismaClient } from '@/lib/generated/prisma'

export interface Context {
  user?: {
    id: string
    sessionId: string
  } | null
  req: NextRequest
  prisma: PrismaClient
}

export async function createTRPCContext({ req }: CreateNextContextOptions): Promise<Context> {
  let user = null
  
  try {
    const authResult = await requireAuth(req)
    user = {
      id: authResult.userId,
      sessionId: authResult.sessionId
    }
  } catch (error) {
    // Silently fail auth, let procedures handle authentication
    console.log('Auth validation failed:', error)
  }

  return {
    user,
    req: req as NextRequest,
    prisma, // Inject Prisma client into context
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>