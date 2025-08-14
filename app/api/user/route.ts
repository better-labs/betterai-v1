import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { userQueries } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    
    // Get user from database
    const user = await userQueries.getUserById(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ user })
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
    const userData = await request.json()
    
    // Upsert user with provided data
    const user = await userQueries.upsertUser({
      id: userId,
      email: userData.email,
      walletAddress: userData.walletAddress,
      username: userData.username,
      avatar: userData.avatar
    })
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Create/update user error:', error)
    
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 })
  }
}
