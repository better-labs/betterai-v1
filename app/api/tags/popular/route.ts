import { NextResponse } from 'next/server'
import { tagQueries } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'

// GET top tags ranked by total market volume across their events' markets
export async function GET(request: Request) {
  try {
    // Auth required for consistency with other prediction-related endpoints
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 10, 25))

    const tags = await tagQueries.getTopTagsByMarketVolume(limit)

    return NextResponse.json({
      success: true,
      data: tags
    } as ApiResponse)
  } catch (error) {
    if (error instanceof Error && error.message?.toLowerCase().includes('auth')) {
      return createAuthErrorResponse(error.message)
    }
    console.error('GET /api/tags/popular error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load popular tags' } as ApiResponse, { status: 500 })
  }
}


