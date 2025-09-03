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

    // Run async - don't await to avoid timeouts, let background processing continue
    Promise.all([
      recoverStuckSessions(prisma, 10),
      cleanupOldSessions(prisma, 24)
    ]).then(([recoveryResult, cleanupResult]) => {
      const result = {
        recovery: recoveryResult,
        cleanup: cleanupResult,
        timestamp: new Date().toISOString()
      }
      console.log('✅ Session recovery completed:', result)
    }).catch((error) => {
      console.error('❌ Session recovery failed:', error)
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session recovery started'
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