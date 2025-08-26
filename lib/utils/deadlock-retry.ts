/**
 * Deadlock retry utility for handling PostgreSQL deadlock errors
 * Detects deadlock errors and retries the operation with exponential backoff
 */

export interface DeadlockRetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  logPrefix?: string
}

/**
 * Checks if an error is a PostgreSQL deadlock error
 */
export function isDeadlockError(error: any): boolean {
  return error &&
    (error.code === '40P01' || // PostgreSQL deadlock detected
     error.message?.includes('deadlock detected') ||
     error.message?.includes('ConnectorError') && error.message?.includes('40P01'))
}

/**
 * Executes an async operation with automatic deadlock retry logic
 * Waits 5 seconds between retries, up to 3 attempts by default
 */
export async function withDeadlockRetry<T>(
  operation: () => Promise<T>,
  options: DeadlockRetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 5000, // 5 seconds
    logPrefix = 'Operation'
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (isDeadlockError(error)) {
        if (attempt < maxRetries) {
          const delayMs = baseDelayMs * attempt // Linear backoff: 5s, 10s, 15s
          console.warn(`${logPrefix}: Deadlock detected (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        } else {
          console.error(`${logPrefix}: Max deadlock retries (${maxRetries}) exceeded`)
        }
      }
      
      // If not a deadlock error, or we've exhausted retries, throw immediately
      throw error
    }
  }

  throw lastError || new Error('Operation failed after retries')
}