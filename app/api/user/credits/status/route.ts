import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { creditManager } from '@/lib/services/credit-manager'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user, but don't fail if not authenticated
    let userId: string | null = null
    try {
      const authResult = await requireAuth(request)
      userId = authResult.userId
    } catch (authError) {
      // User is not authenticated
      return NextResponse.json({
        shouldShowAddCredits: false,
        credits: 0,
        isAuthenticated: false,
        message: 'User not authenticated'
      })
    }

    if (!userId) {
      return NextResponse.json({
        shouldShowAddCredits: false,
        credits: 0,
        isAuthenticated: false,
        message: 'User not authenticated'
      })
    }

    // Check rate limit for status queries
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('creditQuery', identifier)

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }

    // Check if user should see add credits button
    const shouldShowAddCredits = await creditManager.shouldShowAddCreditsButton(userId)

    // Get current credit balance for context
    const credits = await creditManager.getUserCredits(userId)

    return NextResponse.json({
      shouldShowAddCredits,
      credits: credits?.credits || 0,
      isAuthenticated: true
    })
  } catch (error) {
    console.error('Get credits status error:', error)

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({
        shouldShowAddCredits: false,
        credits: 0,
        isAuthenticated: false,
        message: 'User not authenticated'
      })
    }

    return NextResponse.json({ error: 'Failed to get credits status' }, { status: 500 })
  }
}
