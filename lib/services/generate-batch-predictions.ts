import { generatePredictionForMarket } from './generate-single-prediction';
import { prisma } from '../db/prisma'
import { Category } from '../generated/prisma';

export interface BatchPredictionConfig {
  topMarketsCount: number
  endDateRangeHours: number // Default 12 hours
  targetDaysFromNow: number // Default 7 days
  // categoryMix: boolean // DISABLED: Category data no longer meaningful
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

    // Query the top markets by volume in the range
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

    if (config.excludeCategories && config.excludeCategories.length > 0) {
      whereClause.event = {
        endDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        category: { notIn: config.excludeCategories },
      }
    }

    // Calculate 72 hours ago for prediction filtering
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)

    const topMarkets = await prisma.market.findMany({
      where: {
        ...whereClause,
        // Exclude markets that have predictions created in the past 72 hours
        predictions: {
          none: {
            createdAt: {
              gte: seventyTwoHoursAgo,
            },
          },
        },
      },
      orderBy: { volume: 'desc' },
      take: config.topMarketsCount,
      select: {
        id: true,
        question: true,
        volume: true,
        event: {
          select: {
            endDate: true,
          },
        },
      },
    })

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
    useWebSearch?: boolean
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
        const result = await generatePredictionForMarket(marketId, undefined, modelName, undefined, options?.experimentTag, options?.experimentNotes, options?.useWebSearch)
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
    topMarketsCount: 10,
    endDateRangeHours: 12,
    targetDaysFromNow: 7, 
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
    
    console.log(`Found ${topMarkets.length} markets from getTopMarketsByVolumeAndEndDate (requested: ${config.topMarketsCount})`)
    
    if (topMarkets.length === 0) {
      console.log('No markets found matching the criteria')
      return
    }

    // Extract market IDs
    const marketIds = topMarkets.map(market => market.id)
    
    // Generate predictions for the selected markets
    console.log(`
Generating predictions for ${marketIds.length} markets...`)
    // Determine if web search should be enabled for batch predictions
    // Automatically disable web search in development mode regardless of env var
    const batchPredictionsWebSearch = process.env.NODE_ENV === 'production' 
      ? process.env.BATCH_PREDICTIONS_WEB_SEARCH === 'true'
      : false
    console.log(`🌐 Batch predictions web search ${batchPredictionsWebSearch ? 'ENABLED' : 'DISABLED'}`)
    
    const results = await generateBatchPredictions(marketIds, modelName, { 
      concurrency: config.concurrencyPerModel ?? 3,
      experimentTag: experimentOptions?.experimentTag,
      experimentNotes: experimentOptions?.experimentNotes,
      useWebSearch: batchPredictionsWebSearch
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