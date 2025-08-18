
import { NextRequest, NextResponse } from 'next/server';
import { runDataPipeline } from '../../../lib/services/run-data-pipeline';
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    // Check rate limit for data pipeline endpoint
    const identifier = await getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit('dataPipeline', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000) // 1 hour fallback
      )
    }
    
    const { marketId, modelName } = await request.json();

    if (!marketId) {
      return NextResponse.json({ success: false, message: 'Market ID is required' }, { status: 400 });
    }

    const result = await runDataPipeline(marketId, modelName);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      ...result,
      authenticatedUser: userId
    });
  } catch (error) {
    console.error('Error in run-data-pipeline API route:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
