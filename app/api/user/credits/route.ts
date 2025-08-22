import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { creditManager } from '@/lib/services/credit-manager'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'
import { serializeDecimals } from '@/lib/serialization'

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user, but don't fail if not authenticated
    let userId: string | null = null
    try {
      const authResult = await requireAuth(request)
      userId = authResult.userId
    } catch {
      // User is not authenticated, return guest response
      return NextResponse.json({
        success: true,
        data: {
          credits: null,
          isAuthenticated: false,
          message: 'User not authenticated'
        }
      })
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: {
          credits: null,
          isAuthenticated: false,
          message: 'User not authenticated'
        }
      })
    }

    // Check rate limit for credit queries
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('creditQuery', identifier)

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }

    // Get user credits
    const credits = await creditManager.getUserCredits(userId)

    if (!credits) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        credits: serializeDecimals(credits),
        isAuthenticated: true
      }
    })
  } catch (error) {
    console.error('Get user credits error:', error)

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({
        success: false,
        data: {
          credits: null,
          isAuthenticated: false,
          message: 'User not authenticated'
        }
      })
    }

    return NextResponse.json({ error: 'Failed to get user credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get authenticated user, but don't fail if not authenticated
    let userId: string | null = null
    try {
      const authResult = await requireAuth(request)
      userId = authResult.userId
    } catch {
      // User is not authenticated
      return NextResponse.json({
        error: 'Authentication required',
        isAuthenticated: false,
        message: 'Please log in to perform credit operations'
      }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required',
        isAuthenticated: false,
        message: 'Please log in to perform credit operations'
      }, { status: 401 })
    }

    // Check rate limit for credit operations
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('creditOperation', identifier)

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }

    const body = await request.json()
    const { action, amount, reason, metadata } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    switch (action) {
      case 'consume': {
        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required for consume action' }, { status: 400 })
        }

        const success = await creditManager.spendCredits(
          userId,
          amount,
          reason || 'prediction_generated',
          metadata
        )

        if (!success) {
          return NextResponse.json({
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS'
          }, { status: 400 })
        }

        // Return updated credit balance
        const updatedCredits = await creditManager.getUserCredits(userId)

        return NextResponse.json({
          success: true,
          data: {
            credits: serializeDecimals(updatedCredits),
            isAuthenticated: true
          }
        })
      }

      case 'add': {
        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required for add action' }, { status: 400 })
        }

        await creditManager.addCredits(
          userId,
          amount,
          reason || 'manual_addition',
          metadata
        )

        // Return updated credit balance
        const updatedCredits = await creditManager.getUserCredits(userId)

        return NextResponse.json({
          success: true,
          data: {
            credits: serializeDecimals(updatedCredits),
            isAuthenticated: true
          }
        })
      }

      case 'reset': {
        await creditManager.resetDailyCredits(userId)

        // Return updated credit balance
        const updatedCredits = await creditManager.getUserCredits(userId)

        return NextResponse.json({
          success: true,
          data: {
            credits: serializeDecimals(updatedCredits),
            isAuthenticated: true
          }
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('User credits operation error:', error)

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({
        error: 'Authentication required',
        isAuthenticated: false,
        message: 'Please log in to perform credit operations'
      }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to perform credit operation' }, { status: 500 })
  }
}
