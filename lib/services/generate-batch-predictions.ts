import { generatePredictionForMarket } from './generate-single-prediction';
import { marketQueries } from '../db/queries'
import { Category } from '../generated/prisma';

export interface BatchPredictionConfig {
  topMarketsCount: number
  endDateRangeHours: number // Default 12 hours
  targetDaysFromNow: number // Default 7 days
  categoryMix: boolean // Default false
  excludeCategories?: Category[] // Default [Category.CRYPTOCURRENCY]
  /** How many OpenRouter jobs to run in parallel per model. Defaults to 3. */
  concurrencyPerModel?: number
}

interface MarketWithEndDate {
  id: string
  question: string
  volume: number | null
  endDate: Date | null
}

/**
 * Get top markets by volume whose events end within a specified time range
 * @param config - Configuration for the batch prediction
 * @returns Promise<MarketWithEndDate[]>
 */
export async function getTopMarketsByVolumeAndEndDate(
  config: BatchPredictionConfig = {
    topMarketsCount: 1,
    endDateRangeHours: 12,
    targetDaysFromNow: 7,
    categoryMix: false,
    excludeCategories: [Category.CRYPTOCURRENCY]
  }
): Promise<MarketWithEndDate[]> {
  try {
    const now = new Date()
    const targetDate = new Date(now.getTime() + config.targetDaysFromNow * 24 * 60 * 60 * 1000)
    
    // Calculate the range around the target date
    const rangeStart = new Date(targetDate.getTime() - config.endDateRangeHours * 60 * 60 * 1000)
    const rangeEnd = new Date(targetDate.getTime() + config.endDateRangeHours * 60 * 60 * 1000)

    console.log(`Searching for markets with events ending between ${rangeStart.toISOString()} and ${rangeEnd.toISOString()}`)

    // If categoryMix is true, pick the top market by volume for each category (via related event.category)
    if (config.categoryMix) {
      const query = {
        where: {
          event: {
            endDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
        },
        orderBy: { volume: 'desc' } as const,
        include: {
          event: {
            select: { category: true, endDate: true },
          },
        },
      }
      
      console.log('Query date range:', `${rangeStart.toISOString()} to ${rangeEnd.toISOString()}`)
      
      const marketsInRange = await marketQueries.getMarketsByVolumeAndEndDate(rangeStart, rangeEnd, config.topMarketsCount, true, config.excludeCategories)
      console.log(`Found ${marketsInRange.length} markets in range`)
      const seenCategories = new Set<Category>()
      const selected: MarketWithEndDate[] = []

      for (const m of marketsInRange) {
        const category = (m.event?.category as unknown as Category) || null
        if (!category) continue
        if (config.excludeCategories && config.excludeCategories.includes(category)) continue
        if (seenCategories.has(category)) continue
        seenCategories.add(category)
        selected.push({
          id: m.id,
          question: m.question,
          volume: m.volume ? m.volume.toNumber() : null,
          endDate: m.event?.endDate ?? null,
        })
        if (selected.length >= config.topMarketsCount) break
      }
      console.log(`Selected ${selected.length} markets`)
      
      return selected
    }

    // Otherwise: Query the top markets by volume in the range
    const whereClause: {
      event: {
        endDate: {
          gte: Date;
          lte: Date;
        };
        category?: {
          notIn: Category[];
        };
      };
    } = {
      event: {
        endDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    }

    const topMarkets = await marketQueries.getMarketsByVolumeAndEndDate(
      rangeStart,
      rangeEnd,
      config.topMarketsCount,
      false,
      config.excludeCategories
    )

    // Convert volume from Decimal to number and filter out null values
    const processedMarkets: MarketWithEndDate[] = topMarkets
      .map((market) => ({
        id: market.id,
        question: market.question,
        volume: market.volume ? market.volume.toNumber() : null,
        endDate: market.event?.endDate ?? null,
      }))
      .filter((market) => market.volume !== null) as MarketWithEndDate[]

    // Log the results
    console.log(`Found ${processedMarkets.length} markets meeting criteria:`)
    

    return processedMarkets
  } catch (error) {
    console.error('Error getting top markets by volume and end date:', error)
    throw error
  }
}

/**
 * Generate predictions for a batch of markets
 * @param marketIds - Array of market IDs to generate predictions for
 * @param modelName - Optional AI model name to use
 * @returns Promise<Array<{marketId: string, success: boolean, message: string}>>
 */
export async function generateBatchPredictions(
  marketIds: string[],
  modelName?: string,
  options?: { 
    concurrency?: number
    experimentTag?: string
    experimentNotes?: string
  }
): Promise<Array<{marketId: string, success: boolean, message: string}>> {
  const results: Array<{marketId: string, success: boolean, message: string}> = []
  const concurrency = Math.max(1, options?.concurrency ?? 1) // Reduced from 3 to 1 to avoid rate limits

  let index = 0
  async function worker(workerId: number) {
    // Simple worker loop with shared index for concurrency limiting
    // Each worker pulls the next marketId and processes it until none remain
    for (;;) {
      const current = index
      if (current >= marketIds.length) break
      index += 1
      const marketId = marketIds[current]
      try {
        const result = await generatePredictionForMarket(marketId, undefined, modelName, undefined, options?.experimentTag, options?.experimentNotes)
        results.push({
          marketId,
          success: result.success,
          message: result.message,
        })
        console.log(`worker#${workerId} ${marketId}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`)
      } catch (error) {
        console.error(`worker#${workerId} error for market ${marketId}:`, error)
        results.push({
          marketId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1))
  await Promise.all(workers)
  return results
}

/**
 * Main function to get top markets and generate predictions for them
 * @param config - Configuration for the batch prediction
 * @param modelName - Optional AI model name to use
 * @param experimentOptions - Optional experiment tracking options
 * @returns Promise<void>
 */
export async function runBatchPredictionGeneration(
  config: BatchPredictionConfig = {
    topMarketsCount: 3,
    endDateRangeHours: 12,
    targetDaysFromNow: 7, 
    categoryMix: false,
    excludeCategories: [Category.CRYPTOCURRENCY],
    concurrencyPerModel: 3,
  },
  modelName?: string,
  experimentOptions?: {
    experimentTag?: string
    experimentNotes?: string
  }
): Promise<void> {
  try {
    console.log('Starting batch prediction generation...')
    console.log(`Config: ${config.topMarketsCount} markets, ±${config.endDateRangeHours}h around ${config.targetDaysFromNow} days from now`)
    
    // Get top markets by volume and event end date
    const topMarkets = await getTopMarketsByVolumeAndEndDate(config)
    
    if (topMarkets.length === 0) {
      console.log('No markets found matching the criteria')
      return
    }

    // Extract market IDs
    const marketIds = topMarkets.map(market => market.id)
    
    // Generate predictions for the selected markets
    console.log(`
Generating predictions for ${marketIds.length} markets...`)
    const results = await generateBatchPredictions(marketIds, modelName, { 
      concurrency: config.concurrencyPerModel ?? 3,
      experimentTag: experimentOptions?.experimentTag,
      experimentNotes: experimentOptions?.experimentNotes
    })
    
    // Log summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`
Batch prediction generation complete:`)
    console.log(`- Successful: ${successful}`)
    console.log(`- Failed: ${failed}`)
    console.log(`- Total: ${results.length}`)
    
  } catch (error) {
    console.error('Error in batch prediction generation:', error)
    throw error
  }
}