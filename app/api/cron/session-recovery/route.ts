import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { recoverStuckSessions, cleanupOldSessions } from '@/lib/services/prediction-session-recovery'
import type { ApiResponse } from '@/lib/types'

export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Starting prediction session recovery...')

    // Recover stuck sessions (>10 minutes old)
    const recoveryResult = await recoverStuckSessions(prisma, 10)

    // Cleanup old failed sessions (>24 hours old) 
    const cleanupResult = await cleanupOldSessions(prisma, 24)

    const result = {
      recovery: recoveryResult,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Session recovery completed:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session recovery completed',
        data: result
      } as ApiResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Session recovery failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}