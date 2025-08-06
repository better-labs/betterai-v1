import { marketQueries } from '../db/queries'
import { generatePredictionForMarket } from './generate-single-prediction'
import { prisma } from '../db/prisma'

interface BatchPredictionConfig {
  topMarketsCount: number
  endDateRangeHours: number // Default 12 hours
  targetDaysFromNow: number // Default 7 days
}

interface MarketWithEndDate {
  id: string
  question: string
  volume: number | null
  endDate: Date | null
}

/**
 * Get top markets by volume that end within a specified time range
 * @param config - Configuration for the batch prediction
 * @returns Promise<MarketWithEndDate[]>
 */
export async function getTopMarketsByVolumeAndEndDate(
  config: BatchPredictionConfig = {
    topMarketsCount: 1,
    endDateRangeHours: 12,
    targetDaysFromNow: 7
  }
): Promise<MarketWithEndDate[]> {
  try {
    const now = new Date()
    const targetDate = new Date(now.getTime() + config.targetDaysFromNow * 24 * 60 * 60 * 1000)
    
    // Calculate the range around the target date
    const rangeStart = new Date(targetDate.getTime() - config.endDateRangeHours * 60 * 60 * 1000)
    const rangeEnd = new Date(targetDate.getTime() + config.endDateRangeHours * 60 * 60 * 1000)

    console.log(`Searching for markets ending between ${rangeStart.toISOString()} and ${rangeEnd.toISOString()}`)

    // Query markets with end dates in the specified range, ordered by volume
    const topMarkets = await prisma.market.findMany({
      where: {
        endDate: {
          gte: rangeStart,
          lte: rangeEnd
        }
      },
      orderBy: {
        volume: 'desc'
      },
      take: config.topMarketsCount,
      select: {
        id: true,
        question: true,
        volume: true,
        endDate: true
      }
    })

    // Convert volume from string to number and filter out null values
    const processedMarkets: MarketWithEndDate[] = topMarkets
      .map(market => ({
        ...market,
        volume: market.volume ? parseFloat(market.volume.toString()) : null,
        endDate: market.endDate
      }))
      .filter(market => market.volume !== null) as MarketWithEndDate[]

    // Log the results
    console.log(`Found ${processedMarkets.length} markets meeting criteria:`)
    processedMarkets.forEach((market, index) => {
      console.log(`${index + 1}. Market ID: ${market.id}`)
      console.log(`   Question: ${market.question}`)
      console.log(`   Volume: ${market.volume}`)
      console.log(`   End Date: ${market.endDate?.toISOString()}`)
      console.log('---')
    })

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
  modelName?: string
): Promise<Array<{marketId: string, success: boolean, message: string}>> {
  const results = []

  for (const marketId of marketIds) {
    try {
      
      const result = await generatePredictionForMarket(marketId, modelName)
      
      results.push({
        marketId,
        success: result.success,
        message: result.message
      })

      console.log(`Result for ${marketId}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`)
      
      // Add a small delay between predictions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`Error generating prediction for market ${marketId}:`, error)
      results.push({
        marketId,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

/**
 * Main function to get top markets and generate predictions for them
 * @param config - Configuration for the batch prediction
 * @param modelName - Optional AI model name to use
 * @returns Promise<void>
 */
export async function runBatchPredictionGeneration(
  config: BatchPredictionConfig = {
    topMarketsCount: 3,
    endDateRangeHours: 12,
    targetDaysFromNow: 7
  },
  modelName?: string
): Promise<void> {
  try {
    console.log('Starting batch prediction generation...')
    console.log(`Config: ${config.topMarketsCount} markets, ±${config.endDateRangeHours}h around ${config.targetDaysFromNow} days from now`)
    
    // Get top markets by volume and end date
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
    const results = await generateBatchPredictions(marketIds, modelName)
    
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