import type { Event, Market, PolymarketEvent } from '@/lib/types'
import { fetchPolymarketEvents } from './polymarket-client'
import { processAndUpsertPolymarketBatch } from './polymarket-batch-processor'

/**
 * Updates all Polymarket events and markets with proper throttling and pagination
 */
export async function updatePolymarketEventsAndMarketData(options: {
  batchSize?: number,
  delayMs?: number,
  maxRetries?: number,
  retryDelayMs?: number,
  timeoutMs?: number,
  userAgent?: string,
  daysToFetchPast?: number,
  maxBatchFailuresBeforeAbort?: number,
  sortBy?: string,
  maxEvents?: number,
} = {}): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  const {
    batchSize = 100,
    delayMs = 1000,
    daysToFetchPast = 3,
    maxBatchFailuresBeforeAbort = 3,
    sortBy = 'volume', // Default to volume sorting for higher quality markets
    maxEvents,
    ...fetchOptions
  } = options

  console.log(`Starting Polymarket data sync (${batchSize} batch, ${daysToFetchPast}d past, no end limit, sortBy: ${sortBy})`)

  const allInsertedEvents: Event[] = []
  const allInsertedMarkets: Market[] = []
  const errors: string[] = []
  let totalRequests = 0
  let offset = 0
  let hasMoreData = true
  let totalFetched = 0
  let consecutiveErrors = 0
  
  // Compute start date (no end date limit)
  const MS_IN_DAY = 24 * 60 * 60 * 1000
  const startDateMin = new Date(Date.now() - daysToFetchPast * MS_IN_DAY)
  
  // Helper function to calculate current batch size
  const getCurrentBatchSize = (processed: number, batchSize: number, maxEvents?: number) => {
    if (!maxEvents) return batchSize
    const remaining = maxEvents - processed
    return Math.min(batchSize, remaining)
  }

  while (hasMoreData) {
    try {
      totalRequests++
      
      const currentBatchSize = getCurrentBatchSize(totalFetched, batchSize, maxEvents)
      
      // Single termination check
      if (currentBatchSize <= 0) {
        hasMoreData = false
        break
      }
      
      const eventsData = await fetchPolymarketEvents(offset, currentBatchSize, startDateMin, null, fetchOptions, sortBy)
      
      if (eventsData.length > 0) {
        const batchResult = await processAndUpsertPolymarketBatch(eventsData, { 
          logPrefix: `bulk-batch-${totalRequests}`,
          enableTiming: true 
        })
        allInsertedEvents.push(...batchResult.processedEvents)
        allInsertedMarkets.push(...batchResult.processedMarkets)
        totalFetched += batchResult.totalProcessed
        console.log(`Batch ${totalRequests}: Processed ${eventsData.length} events, ${batchResult.processedEvents.length} events upserted, ${batchResult.processedMarkets.length} markets upserted (total: ${totalFetched})`)
      }

      // Single exit condition check
      hasMoreData = eventsData.length === currentBatchSize && (!maxEvents || totalFetched < maxEvents)
      
      if (hasMoreData) {
        offset += currentBatchSize
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
      // success resets error counter
      consecutiveErrors = 0
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`Failed to process batch with offset ${offset}:`, errorMsg)
      errors.push(errorMsg)
      consecutiveErrors += 1
      if (consecutiveErrors >= maxBatchFailuresBeforeAbort) {
        console.error(`Aborting run after ${consecutiveErrors} consecutive failures (threshold: ${maxBatchFailuresBeforeAbort}).`)
        hasMoreData = false
      } else {
        const backoffMs = (fetchOptions.retryDelayMs ?? 2000) * consecutiveErrors
        console.warn(`Continuing after error. Backing off for ${backoffMs}ms then retrying same offset (${offset}). Consecutive errors: ${consecutiveErrors}.`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        // Do not change offset; retry the same page
      }
    }
  }

  console.log(`Finished processing all batches. Total: ${totalFetched}, Requests: ${totalRequests}, Errors: ${errors.length}`)
  
  return {
    insertedEvents: allInsertedEvents,
    insertedMarkets: allInsertedMarkets,
    totalFetched,
    totalRequests,
    errors
  }
}

