import { NextRequest, NextResponse } from 'next/server'
import { leaderboardQueries } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tag = searchParams.get('tag')
    
    const leaderboard = tag 
      ? await leaderboardQueries.getAIModelLeaderboardByTag(tag)
      : await leaderboardQueries.getAIModelLeaderboard()

    const response: ApiResponse<{ leaderboard: typeof leaderboard }> = {
      success: true,
      data: { leaderboard }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Leaderboard API error:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch leaderboard data'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}