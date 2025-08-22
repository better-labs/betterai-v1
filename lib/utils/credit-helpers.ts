import { userQueries } from '@/lib/db/queries'
import type { CreditBalanceClient } from '@/lib/types'

/**
 * Check if user can afford a prediction with the given number of models
 */
export async function canAffordPrediction(userId: string, modelCount: number): Promise<boolean> {
  try {
    const credits = await userQueries.getUserCredits(userId)
    return credits ? credits.credits >= modelCount : false
  } catch (error) {
    console.error('Error checking credit affordability:', error)
    return false
  }
}

/**
 * Get credit requirement text for UI display
 */
export function getCreditRequirementText(modelCount: number): string {
  if (modelCount <= 1) {
    return '1 credit'
  } else {
    return `${modelCount} credits`
  }
}

/**
 * Get credit affordability status for client-side display
 */
export function checkCreditAffordability(
  creditBalance: CreditBalanceClient | null, 
  requiredCredits: number
): { canAfford: boolean; message?: string } {
  if (!creditBalance) {
    return { 
      canAfford: false, 
      message: 'Login required to check credits' 
    }
  }

  if (creditBalance.credits < requiredCredits) {
    return { 
      canAfford: false, 
      message: `Insufficient credits. Need ${requiredCredits}, have ${creditBalance.credits}` 
    }
  }

  return { canAfford: true }
}

/**
 * Format credit display for UI
 */
export function formatCreditDisplay(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`
}