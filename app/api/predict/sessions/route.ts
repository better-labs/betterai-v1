import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { getSessionsByUser, getSession, getSessionStats } from '@/lib/services/generate-user-prediction'
import type { ApiResponse } from '@/lib/types'

// GET /api/predict/sessions - Get user's prediction sessions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    
    const userSessions = getSessionsByUser(userId)
    
    const responseData: ApiResponse = {
      success: true,
      data: {
        sessions: userSessions,
        count: userSessions.length
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching prediction sessions:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch prediction sessions',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Admin endpoint to get session statistics
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    
    // For now, allow any authenticated user to view stats
    // In production, you might want to restrict this to admin users
    const stats = getSessionStats()
    
    const responseData: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching session statistics:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch session statistics',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}