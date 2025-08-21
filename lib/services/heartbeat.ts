/**
 * BetterStack Heartbeat Monitoring Service
 * 
 * Sends heartbeat signals to BetterStack to monitor cron job health.
 * Call sendHeartbeat() after successful cron job completion.
 */

export enum HeartbeatType {
  POLYMARKET_DATA = 'POLYMARKET_DATA',
  BATCH_PREDICTIONS = 'BATCH_PREDICTIONS', 
  PREDICTION_CHECK = 'PREDICTION_CHECK'
}

const HEARTBEAT_URLS = {
  [HeartbeatType.POLYMARKET_DATA]: process.env.BETTERSTACK_HEARTBEAT_POLYMARKET_DATA,
  [HeartbeatType.BATCH_PREDICTIONS]: process.env.BETTERSTACK_HEARTBEAT_BATCH_PREDICTIONS,
  [HeartbeatType.PREDICTION_CHECK]: process.env.BETTERSTACK_HEARTBEAT_PREDICTION_CHECK,
}

/**
 * Send a heartbeat signal to BetterStack
 * @param type - The type of heartbeat to send
 * @returns Promise<boolean> - True if heartbeat was sent successfully
 */
export async function sendHeartbeat(type: HeartbeatType): Promise<boolean> {
  const url = HEARTBEAT_URLS[type]
  
  if (!url) {
    console.warn(`BetterStack heartbeat URL not configured for ${type}`)
    return false
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      console.log(`✅ BetterStack heartbeat sent for ${type}`)
      return true
    } else {
      console.error(`❌ BetterStack heartbeat failed for ${type}: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error(`❌ BetterStack heartbeat error for ${type}:`, error)
    return false
  }
}

/**
 * Safe wrapper that doesn't throw errors - use this in production cron jobs
 * @param type - The type of heartbeat to send  
 */
export async function sendHeartbeatSafe(type: HeartbeatType): Promise<void> {
  try {
    await sendHeartbeat(type)
  } catch (error) {
    // Silent failure - don't let heartbeat issues break cron jobs
    console.error(`BetterStack heartbeat silent failure for ${type}:`, error)
  }
}