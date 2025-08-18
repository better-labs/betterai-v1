import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

/**
 * Authenticates cron job requests using CRON_SECRET
 */
export function authenticateCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return false;
  }
  
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check x-cron-secret header (alternative method)
  const cronSecretHeader = request.headers.get('x-cron-secret');
  if (cronSecretHeader === cronSecret) {
    return true;
  }
  
  // Check Vercel Cron authentication (if deployed on Vercel)
  const vercelCronSecret = request.headers.get('x-vercel-cron-secret');
  if (vercelCronSecret && vercelCronSecret === cronSecret) {
    return true;
  }
  
  return false;
}

/**
 * Returns a standardized unauthorized response for cron endpoints
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Unauthorized. This endpoint requires authentication via CRON_SECRET.' 
    } as ApiResponse),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Middleware wrapper for cron endpoints - use at the start of your cron route handlers
 */
export function requireCronAuth(request: NextRequest): Response | null {
  if (!authenticateCronRequest(request)) {
    return createUnauthorizedResponse();
  }
  return null; // Continue processing
}