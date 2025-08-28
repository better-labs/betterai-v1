import { PrivyClient } from '@privy-io/server-auth'

// Initialize Privy client for server-side authentication
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
const privyAppSecret = process.env.PRIVY_SERVER_APP_SECRET

if (!privyAppId || !privyAppSecret) {
  console.error('Missing Privy environment variables:', {
    NEXT_PUBLIC_PRIVY_APP_ID: privyAppId ? 'present' : 'missing',
    PRIVY_SERVER_APP_SECRET: privyAppSecret ? 'present' : 'missing'
  })
  throw new Error('Privy environment variables are not configured')
}

const privy = new PrivyClient(privyAppId, privyAppSecret)

/**
 * Extracts and verifies the Privy access token from a request
 * Following Privy's documentation: https://docs.privy.io/authentication/user-authentication/access-tokens
 */
export async function requireAuth(request: Request): Promise<{ userId: string; sessionId: string }> {
  // Extract token from Authorization header (Bearer token approach)
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authentication failed: No valid authorization header provided')
    throw new Error('No valid authorization header provided')
  }

  const accessToken = authHeader.replace('Bearer ', '')

  if (!accessToken || accessToken.trim() === '') {
    console.error('Authentication failed: Empty access token')
    throw new Error('Empty access token provided')
  }

  try {
    // Verify the token using Privy's server SDK
    // Use verification key from env if available for better performance
    const verificationKey = process.env.PRIVY_SERVER_VERIFICATION_KEY
    // console.log('Verifying access token with Privy...', {
    //   hasVerificationKey: !!verificationKey,
    //   tokenLength: accessToken.length
    // })

    const verifiedClaims = verificationKey
      ? await privy.verifyAuthToken(accessToken, verificationKey)
      : await privy.verifyAuthToken(accessToken)

    // console.log('Token verification successful:', {
    //   userId: verifiedClaims.userId,
    //   sessionId: verifiedClaims.sessionId
    // })

    return {
      userId: verifiedClaims.userId,
      sessionId: verifiedClaims.sessionId
    }
  } catch (error) {
    console.error('Token verification failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Invalid or expired authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`)
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


