// Test script to verify rate limiting functionality
import { checkRateLimit } from './rate-limit';

export async function testRateLimit() {
  console.log('Testing rate limiting...');
  
  // Test predict endpoint rate limit (10 requests per hour)
  const testIdentifier = 'test:user123';
  
  console.log('Testing predict endpoint (limit: 10/hour)...');
  
  for (let i = 1; i <= 12; i++) {
    const result = await checkRateLimit('predict', testIdentifier);
    console.log(`Request ${i}:`, {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit
    });
    
    if (!result.success) {
      console.log('✅ Rate limit triggered correctly at request', i);
      break;
    }
  }
  
  // Test a different endpoint
  console.log('\nTesting userWrite endpoint (limit: 50/hour)...');
  const userResult = await checkRateLimit('userWrite', 'test:user456');
  console.log('User write result:', {
    success: userResult.success,
    remaining: userResult.remaining,
    limit: userResult.limit
  });
  
  console.log('✅ Rate limiting test completed');
}

// Export for potential use in API routes
export const testRateLimitInDev = async () => {
  if (process.env.NODE_ENV === 'development') {
    await testRateLimit();
  }
};