import { PrivyClient } from '@privy-io/server-auth'

// Initialize Privy client for server-side authentication
const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_SERVER_APP_SECRET!)

/**
 * Extracts and verifies the Privy access token from a request
 * Following Privy's documentation: https://docs.privy.io/authentication/user-authentication/access-tokens
 */
export async function requireAuth(request: Request): Promise<{ userId: string; sessionId: string }> {
  // Extract token from Authorization header (Bearer token approach)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header provided')
  }
  
  const accessToken = authHeader.replace('Bearer ', '')
  
  try {
    // Verify the token using Privy's server SDK
    // Use verification key from env if available for better performance
    const verificationKey = process.env.PRIVY_SERVER_VERIFICATION_KEY
    const verifiedClaims = verificationKey 
      ? await privy.verifyAuthToken(accessToken, verificationKey)
      : await privy.verifyAuthToken(accessToken)
    
    return {
      userId: verifiedClaims.userId,
      sessionId: verifiedClaims.sessionId
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw new Error('Invalid or expired authentication token')
  }
}

/**
 * Optional authentication - returns user context if authenticated, null otherwise
 * Useful for endpoints that can work with or without authentication
 */
export async function optionalAuth(request: Request): Promise<{ userId: string; sessionId: string } | null> {
  try {
    return await requireAuth(request)
  } catch (error) {
    return null
  }
}

/**
 * Creates an error response for authentication failures
 */
export function createAuthErrorResponse(message: string = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message,
      code: 'UNAUTHORIZED'
    }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}
