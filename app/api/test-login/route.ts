import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Test-only login endpoint for E2E testing
 * Creates a mock user session that bypasses Privy authentication
 * 
 * SECURITY: Only enabled when E2E_TEST_MODE=1
 */
export async function GET() {
  // Only allow in test mode
  if (process.env.E2E_TEST_MODE !== '1') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // Create or get a test user
    const testUserId = 'e2e-test-user-123';
    const testUser = await prisma.user.upsert({
      where: { id: testUserId },
      update: {
        lastActiveAt: new Date(),
      },
      create: {
        id: testUserId,
        privyUserId: 'test-privy-user',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        credits: 100, // Give test user some credits
      },
    });

    // Create a mock JWT token for testing
    // In real tests, we'll intercept the requireAuth function
    const mockToken = Buffer.from(JSON.stringify({
      userId: testUser.id,
      sessionId: 'test-session-123',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    })).toString('base64');

    const response = new NextResponse('Test login successful', { status: 200 });
    
    // Set a test session cookie (for cookie-based auth if needed)
    response.cookies.set('test-session', mockToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    // Return the token for Authorization header use
    return NextResponse.json({
      success: true,
      token: mockToken,
      userId: testUser.id,
      message: 'Test authentication successful'
    });

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { error: 'Failed to create test session' }, 
      { status: 500 }
    );
  }
}