import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { getSession, deleteSession } from '@/lib/services/generate-user-prediction'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

// GET /api/predict/sessions/[sessionId] - Get specific session details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireAuth(request)
    const { sessionId } = await params
    
    if (!sessionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Session ID is required',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const session = getSession(sessionId)
    
    if (!session) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Ensure user can only access their own sessions
    if (session.userId !== userId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 403 })
    }
    
    const responseData: ApiResponse = {
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching prediction session:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch prediction session',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// DELETE /api/predict/sessions/[sessionId] - Delete a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireAuth(request)
    const { sessionId } = await params
    
    if (!sessionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Session ID is required',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const session = getSession(sessionId)
    
    if (!session) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Ensure user can only delete their own sessions
    if (session.userId !== userId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 403 })
    }

    const deleted = deleteSession(sessionId)
    
    const responseData: ApiResponse = {
      success: true,
      data: { deleted },
      message: 'Session deleted successfully',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error deleting prediction session:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to delete prediction session',
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}