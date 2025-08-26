import type { Event, Market, PolymarketEvent } from '@/lib/types'
import { fetchPolymarketEvents } from './polymarket-client'
import { processAndUpsertPolymarketBatch } from './polymarket-batch-processor'

/**
 * Updates all Polymarket events and markets with proper throttling and pagination
 */
export async function updatePolymarketEventsAndMarketData(options: {
  limit?: number,
  delayMs?: number,
  maxRetries?: number,
  retryDelayMs?: number,
  timeoutMs?: number,
  userAgent?: string,
  daysToFetchPast?: number,
  daysToFetchFuture?: number,
  maxBatchFailuresBeforeAbort?: number,
  sortBy?: string,
  totalEventLimit?: number,
} = {}): Promise<{
  insertedEvents: Event[],
  insertedMarkets: Market[],
  totalFetched: number,
  totalRequests: number,
  errors: string[]
}> {
  const {
    limit = 100,
    delayMs = 1000,
    daysToFetchPast = 8,
    daysToFetchFuture = 21,
    maxBatchFailuresBeforeAbort = 3,
    sortBy,
    totalEventLimit,
    ...fetchOptions
  } = options

  console.log(`Starting Polymarket data sync (${limit} batch, ${daysToFetchPast}d past, ${daysToFetchFuture}d future)`)

  const allInsertedEvents: Event[] = []
  const allInsertedMarkets: Market[] = []
  const errors: string[] = []
  let totalRequests = 0
  let offset = 0
  let hasMoreData = true
  let totalFetched = 0
  let consecutiveErrors = 0
  
  // Compute a fixed date window for this run
  const MS_IN_DAY = 24 * 60 * 60 * 1000
  const startDateMin = new Date(Date.now() - daysToFetchPast * MS_IN_DAY)
  const endDateMax = new Date(Date.now() + daysToFetchFuture * MS_IN_DAY)
  

  while (hasMoreData) {
    try {
      totalRequests++
      
      // Check if we've reached the total event limit
      if (totalEventLimit && totalFetched >= totalEventLimit) {
        // Reached event limit - stopping
        hasMoreData = false
        break
      }
      
      // Adjust batch size if we're close to the limit
      let adjustedLimit = limit
      if (totalEventLimit && (totalFetched + limit > totalEventLimit)) {
        adjustedLimit = totalEventLimit - totalFetched
        // Adjusting final batch size
      }
      
      const eventsData = await fetchPolymarketEvents(offset, adjustedLimit, startDateMin, endDateMax, fetchOptions, sortBy)
      
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

      // Stop if we've reached the total event limit or no more data
      if ((totalEventLimit && totalFetched >= totalEventLimit) || eventsData.length < adjustedLimit) {
        hasMoreData = false
      } else {
        offset += adjustedLimit
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

