import { PrivyClient } from '@privy-io/server-auth'
import { parse } from 'cookie'
import type { AuthContext } from '@/lib/trpc/context/types'

// Initialize Privy client for server-side authentication
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_SERVER_APP_SECRET!
)

/**
 * Core authentication function - framework agnostic
 * Accepts raw cookie and auth header strings
 */
async function getAuthCore(params: {
  cookie: string
  authHeader: string
}): Promise<AuthContext> {
  const { cookie, authHeader } = params
  
  try {
    // Try multiple token sources in priority order
    const bearer = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null
      
    const cookies = parse(cookie || '')
    const sessionToken = bearer || 
                        cookies['privy-token'] || 
                        cookies['privy:token'] ||
                        cookies['privy-session'] ||
                        null

    if (!sessionToken) {
      return { user: null }
    }

    // Validate token using Privy server SDK
    const verificationKey = process.env.PRIVY_SERVER_VERIFICATION_KEY
    const verifiedClaims = verificationKey 
      ? await privy.verifyAuthToken(sessionToken, verificationKey)
      : await privy.verifyAuthToken(sessionToken)
    
    // Extract user info from verified claims
    const user = {
      id: verifiedClaims.userId,
      email: (verifiedClaims as any).email, // Optional property
      sessionId: (verifiedClaims as any).sessionId || verifiedClaims.userId,
    }
    
    const session = {
      token: sessionToken,
      expiresAt: (verifiedClaims as any).exp 
        ? new Date((verifiedClaims as any).exp * 1000) 
        : undefined,
    }

    return { user, session }
    
  } catch (error) {
    // Log auth failures for debugging (but don't throw)
    console.log('Privy auth validation failed:', error instanceof Error ? error.message : error)
    return { user: null }
  }
}

/**
 * Extract auth from Web API Request (for tRPC fetch adapter)
 */
export async function getAuthFromRequest(req: Request): Promise<AuthContext> {
  const cookie = req.headers.get('cookie') ?? ''
  const authHeader = req.headers.get('authorization') ?? ''
  
  return getAuthCore({ cookie, authHeader })
}

/**
 * Extract auth from Next.js headers/cookies (for RSC)
 */
export async function getAuthFromHeadersCookies(params: {
  headers: ReturnType<typeof import('next/headers').headers>
  cookies: ReturnType<typeof import('next/headers').cookies>
}): Promise<AuthContext> {
  const { headers, cookies } = params
  
  // Await the promises (Next.js 15)
  const cookiesResult = await cookies
  const headersResult = await headers
  
  // Convert Next.js cookies to cookie string
  const cookie = cookiesResult
    .getAll()
    .map((c: any) => `${c.name}=${c.value}`)
    .join('; ')
    
  const authHeader = headersResult.get('authorization') ?? ''
  
  return getAuthCore({ cookie, authHeader })
}

/**
 * Validate user session and return user info
 * Legacy compatibility function for existing code
 */
export async function validateUser(token: string): Promise<{ id: string; sessionId: string }> {
  try {
    const verifiedClaims = await privy.verifyAuthToken(token)
    return {
      id: verifiedClaims.userId,
      sessionId: verifiedClaims.sessionId,
    }
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  return adminUserIds.includes(userId)
}

/**
 * Extract user ID from token without full validation
 * Useful for logging/analytics where security isn't critical
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    // Simple JWT decode without verification
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )
    
    return payload.sub || payload.userId || null
  } catch {
    return null
  }
}