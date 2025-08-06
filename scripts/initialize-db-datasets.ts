#!/usr/bin/env node

import { config } from 'dotenv'

// Load environment variables FIRST, before any other imports
config({ path: '.env.local' })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function main() {
  console.log('Starting Polymarket events update...')
  
  try {
    // Dynamically import the function after environment variables are loaded
    const { updatePolymarketEventsAndMarketData } = await import('../lib/services/events')
    
    const result = await updatePolymarketEventsAndMarketData({
      limit: 150, // Small limit for testing
      delayMs: 100, // Faster delay for testing
      maxRetries: 1, // Fewer retries for testing
      timeoutMs: 10000, // Shorter timeout for testing
    })

    console.log('Update completed successfully!')
    console.log('Results:', {
      insertedEvents: result.insertedEvents.length,
      insertedMarkets: result.insertedMarkets.length,
      totalFetched: result.totalFetched,
      totalRequests: result.totalRequests,
      errors: result.errors.length
    })

    if (result.errors.length > 0) {
      console.log('Errors encountered:', result.errors)
    }

    console.log('Starting AI models update...')
    const { updateAIModels } = await import('../lib/services/ai-models')
    const aiModelsResult = await updateAIModels()

    console.log('AI models update completed successfully!')
    console.log('Results:', {
      totalFetched: aiModelsResult.totalFetched,
      totalUpserted: aiModelsResult.totalUpserted,
      success: aiModelsResult.success,
      error: aiModelsResult.error
    })

    if (aiModelsResult.error) {
      console.log('Error encountered:', aiModelsResult.error)
    }


  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main() 