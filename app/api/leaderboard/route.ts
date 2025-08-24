import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as leaderboardService from '@/lib/services/leaderboard-service'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tag = searchParams.get('tag')
    
    const leaderboard = tag 
      ? await leaderboardService.getAIModelLeaderboardByTag(prisma, tag)
      : await leaderboardService.getAIModelLeaderboard(prisma)

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