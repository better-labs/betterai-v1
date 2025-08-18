import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';

// Get environment prefix for namespacing
const getEnvironmentPrefix = () => {
  if (process.env.NODE_ENV === 'production') return 'prod';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  return 'dev';
};

const envPrefix = getEnvironmentPrefix();

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  // High-cost AI operations (strictest limits)
  predict: {
    requests: 10,
    window: '1h', // 10 requests per hour
  },
  dataPipeline: {
    requests: 5, 
    window: '1h', // 5 requests per hour
  },
  
  // Database write operations (more permissive)
  userWrite: {
    requests: 50,
    window: '1h', // 50 requests per hour
  },
  marketWrite: {
    requests: 100,
    window: '1h', // 100 requests per hour
  },
  eventWrite: {
    requests: 100,
    window: '1h', // 100 requests per hour
  },
} as const;

// Create rate limiter with environment namespacing
export const createRateLimit = (endpoint: keyof typeof rateLimitConfigs) => {
  const config = rateLimitConfigs[endpoint];
  
  return new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `${envPrefix}:ratelimit:${endpoint}`,
  });
};

// Get identifier for rate limiting (userId or IP address)
export const getRateLimitIdentifier = async (request: NextRequest, userId?: string) => {
  // Prefer userId if authenticated, fallback to IP
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP address from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
};

// Main rate limiting function
export const checkRateLimit = async (
  endpoint: keyof typeof rateLimitConfigs,
  identifier: string
) => {
  // Skip rate limiting in local development
  if (process.env.NODE_ENV === 'development' && envPrefix === 'dev') {
    return { success: true };
  }
  
  const rateLimit = createRateLimit(endpoint);
  const result = await rateLimit.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
};

// Rate limit response helper
export const createRateLimitResponse = (remaining: number, reset: number | Date) => {
  const resetDate = typeof reset === 'number' ? new Date(reset) : reset;
  
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      remaining,
      resetAt: resetDate.toISOString()
    }),
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetDate.getTime().toString(),
        'Retry-After': Math.ceil((resetDate.getTime() - Date.now()) / 1000).toString(),
      }
    }
  );
};