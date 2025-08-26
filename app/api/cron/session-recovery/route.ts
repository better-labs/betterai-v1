import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { recoverStuckSessions, cleanupOldSessions } from '@/lib/services/prediction-session-recovery'

export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
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

    return Response.json({
      success: true,
      message: 'Session recovery completed',
      data: result
    })

  } catch (error) {
    console.error('❌ Session recovery failed:', error)

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}