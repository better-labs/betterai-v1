import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import * as userService from '@/lib/services/user-service'
import { mapUserToDTO } from '@/lib/dtos'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    
    // Get user from database
    const userDto = await userService.getUserByIdSerialized(prisma, userId)
    
    if (!userDto) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ user: userDto })
  } catch (error) {
    console.error('Get user error:', error)
    
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    
    // Check rate limit for user write operations
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('userWrite', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000) // 1 hour fallback
      )
    }
    
    const userData = await request.json()
    
    // Upsert user with provided data
    const user = await userService.upsertUser(prisma, {
      id: userId,
      email: userData.email,
      walletAddress: userData.walletAddress,
      username: userData.username,
      avatar: userData.avatar
    })
    
    const userDto = mapUserToDTO(user)
    return NextResponse.json({ user: userDto })
  } catch (error) {
    console.error('Create/update user error:', error)
    
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 })
  }
}
