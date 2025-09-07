/**
 * Reusable utilities for extracting user data from Privy user objects
 */

/**
 * Extract email from Privy user object
 * @param privyUser - Privy user object
 * @returns email string or undefined
 */
export function extractUserEmail(privyUser: any): string | undefined {
  return privyUser?.email?.address || privyUser?.google?.email
}

/**
 * Extract username from Privy user object
 * @param privyUser - Privy user object
 * @returns username string or undefined
 */
export function extractUsername(privyUser: any): string | undefined {
  return privyUser?.google?.name || privyUser?.email?.name
}

/**
 * Extract avatar URL from Privy user object
 * @param privyUser - Privy user object
 * @returns avatar URL string or undefined
 */
export function extractUserAvatar(privyUser: any): string | undefined {
  return privyUser?.google?.picture || privyUser?.email?.picture
}

/**
 * Extract wallet address from Privy user object
 * @param privyUser - Privy user object
 * @returns wallet address string or undefined
 */
export function extractWalletAddress(privyUser: any): string | undefined {
  return privyUser?.wallet?.address
}
