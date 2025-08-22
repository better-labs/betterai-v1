import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { creditManager } from '@/lib/services/credit-manager'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'
import { serializeDecimals } from '@/lib/serialization'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

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
      credits: serializeDecimals(credits)
    })
  } catch (error) {
    console.error('Get user credits error:', error)

    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }

    return NextResponse.json({ error: 'Failed to get user credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

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

        const success = await creditManager.consumeCredits(
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
          credits: serializeDecimals(updatedCredits)
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
          credits: serializeDecimals(updatedCredits)
        })
      }

      case 'reset': {
        await creditManager.resetDailyCredits(userId)

        // Return updated credit balance
        const updatedCredits = await creditManager.getUserCredits(userId)

        return NextResponse.json({
          success: true,
          credits: serializeDecimals(updatedCredits)
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('User credits operation error:', error)

    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }

    return NextResponse.json({ error: 'Failed to perform credit operation' }, { status: 500 })
  }
}
