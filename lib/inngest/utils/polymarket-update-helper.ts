/**
 * Shared utilities for Polymarket data update Inngest functions
 * Reduces code duplication between regular and 6-month update functions
 */

import { structuredLogger } from '../../utils/structured-logger'

export interface PolymarketUpdateConfig {
  batchSize: number
  delayMs: number
  daysToFetchPast: number
  daysToFetchFuture?: number
  maxRetries: number
  retryDelayMs: number
  timeoutMs: number
  userAgent: string
  sortBy?: string
  maxEvents: number
  maxBatchFailuresBeforeAbort: number
  timeoutWarningMs: number
  timeoutAbortMs: number
  onTimeoutWarning: (elapsed: number, batch: number) => void
  onTimeout: (elapsed: number, batch: number) => void
}

/**
 * Creates a unique execution ID for tracking
 */
export function createExecutionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Creates timeout callback functions with proper logging
 */
export function createTimeoutCallbacks(
  executionId: string, 
  logPrefix: string,
  timeoutAbortMs: number
) {
  return {
    onTimeoutWarning: (elapsed: number, batch: number) => {
      structuredLogger.warn(`timeout_warning${logPrefix ? '_' + logPrefix : ''}`, 
        `${logPrefix ? logPrefix + ' ' : ''}update approaching timeout limit`, {
        executionId,
        elapsedMs: elapsed,
        batchNumber: batch,
        remainingMs: timeoutAbortMs - elapsed
      })
    },
    onTimeout: (elapsed: number, batch: number) => {
      structuredLogger.error(`timeout_abort${logPrefix ? '_' + logPrefix : ''}`, 
        `${logPrefix ? logPrefix + ' ' : ''}update aborted to prevent runaway costs`, {
        executionId,
        elapsedMs: elapsed,
        batchNumber: batch,
        processedBatches: batch
      })
    }
  }
}

/**
 * Creates Polymarket update configuration from environment variables
 */
export function createPolymarketConfig(
  envPrefix: string,
  defaults: Partial<PolymarketUpdateConfig>,
  executionId: string,
  logPrefix: string = ''
): PolymarketUpdateConfig {
  const TIMEOUT_WARNING_MS = Number(process.env[`${envPrefix}_TIMEOUT_WARNING_MS`] ?? 10 * 60 * 1000)
  const TIMEOUT_ABORT_MS = Number(process.env[`${envPrefix}_TIMEOUT_ABORT_MS`] ?? 12 * 60 * 1000)
  
  const timeoutCallbacks = createTimeoutCallbacks(executionId, logPrefix, TIMEOUT_ABORT_MS)
  
  return {
    batchSize: Number(process.env[`${envPrefix}_BATCH_SIZE`] ?? defaults.batchSize ?? 50),
    delayMs: Number(process.env[`${envPrefix}_DELAY_MS`] ?? defaults.delayMs ?? 1000),
    daysToFetchPast: Number(process.env[`${envPrefix}_DAYS_PAST`] ?? defaults.daysToFetchPast ?? 8),
    daysToFetchFuture: Number(process.env[`${envPrefix}_DAYS_FUTURE`] ?? defaults.daysToFetchFuture),
    maxRetries: Number(process.env[`${envPrefix}_MAX_RETRIES`] ?? defaults.maxRetries ?? 3),
    retryDelayMs: Number(process.env[`${envPrefix}_RETRY_DELAY_MS`] ?? defaults.retryDelayMs ?? 2000),
    timeoutMs: Number(process.env[`${envPrefix}_TIMEOUT_MS`] ?? defaults.timeoutMs ?? 30000),
    userAgent: process.env[`${envPrefix}_USER_AGENT`] || defaults.userAgent || 'BetterAI/1.0',
    sortBy: process.env[`${envPrefix}_SORT_BY`] || defaults.sortBy,
    maxEvents: Number(process.env[`${envPrefix}_MAX_EVENTS_LIMIT`] ?? process.env[`${envPrefix}_LIMIT`] ?? defaults.maxEvents ?? 50),
    maxBatchFailuresBeforeAbort: Number(process.env[`${envPrefix}_MAX_BATCH_FAILURES`] ?? defaults.maxBatchFailuresBeforeAbort ?? 3),
    timeoutWarningMs: TIMEOUT_WARNING_MS,
    timeoutAbortMs: TIMEOUT_ABORT_MS,
    ...timeoutCallbacks
  }
}

/**
 * Handles timeout abort errors gracefully, returning partial success
 */
export function handleTimeoutError(errorMessage: string, executionId: string, logSuffix: string = '') {
  if (errorMessage.includes('TIMEOUT_ABORT')) {
    structuredLogger.info(`polymarket_data_update_timeout${logSuffix ? '_' + logSuffix : ''}`, 
      `Update aborted due to timeout prevention`, {
      executionId,
      error: {
        message: errorMessage
      }
    })
    
    return {
      summary: {
        totalRequests: 0,
        totalFetched: 0,
        eventsInserted: 0,
        marketsInserted: 0,
        errors: 0,
        partialSuccess: true,
        abortReason: 'timeout_prevention'
      }
    }
  }
  return null
}

/**
 * Logs successful completion with summary only (no full objects)
 */
export function logUpdateCompletion(
  result: any, 
  executionId: string, 
  logEventName: string,
  message: string
) {
  // Get summary stats without logging full objects
  const eventCategories = result.insertedEvents?.reduce((acc: Record<string, number>, event: any) => {
    const category = event.category || 'UNKNOWN'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {}) || {}

  const marketStats = {
    count: result.insertedMarkets?.length || 0,
    withOutcomes: result.insertedMarkets?.filter((m: any) => m.outcomePrices?.length > 0).length || 0
  }

  structuredLogger.info(logEventName, message, {
    executionId,
    totalRequests: result.totalRequests,
    totalFetched: result.totalFetched,
    summary: {
      eventsInserted: result.insertedEvents?.length || 0,
      marketsInserted: result.insertedMarkets?.length || 0,
      eventsByCategory: eventCategories,
      marketStats,
      errors: result.errors?.length || 0
    }
  })
}

/**
 * Logs configuration for debugging
 */
export function logConfiguration(config: PolymarketUpdateConfig, executionId: string, logEventName: string) {
  structuredLogger.info(logEventName, 'Using Polymarket update configuration', {
    executionId,
    config: {
      batchSize: config.batchSize,
      maxEvents: config.maxEvents,
      delayMs: config.delayMs,
      daysToFetchPast: config.daysToFetchPast,
      daysToFetchFuture: config.daysToFetchFuture,
      sortBy: config.sortBy,
      timeoutWarningMs: config.timeoutWarningMs,
      timeoutAbortMs: config.timeoutAbortMs
    }
  })
}