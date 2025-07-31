import { NextRequest } from 'next/server'
import { updateTrendingEvents } from '@/lib/data/events'
import type { ApiResponse, DatabaseMetadata } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    // Add your cron job authentication logic here
    // if (token !== process.env.CRON_SECRET) {
    //   return Response.json(
    //     { success: false, error: 'Invalid token' } as ApiResponse,
    //     { status: 401 }
    //   )
    // }

    const startTime = Date.now()
    await updateTrendingEvents()
    const duration = Date.now() - startTime

    const metadata: DatabaseMetadata = {
      database: "neon",
      orm: "drizzle",
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }

    return Response.json({
      success: true,
      message: 'Trending events updated successfully',
      data: {
        duration: `${duration}ms`,
        metadata
      }
    } as ApiResponse)
  } catch (error) {
    console.error('Update trending events error:', error)
    return Response.json(
      { success: false, error: 'Failed to update trending events' } as ApiResponse,
      { status: 500 }
    )
  }
}

// Also support GET for easier testing
export async function GET() {
  return Response.json({
    success: true,
    message: 'Update trending events endpoint',
    data: {
      method: 'POST',
      description: 'Updates trending rank for all events based on volume'
    }
  } as ApiResponse)
} 