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
  console.log('Starting batch prediction generation...')
  
  try {
    // Dynamically import the function after environment variables are loaded
    const { runBatchPredictionGeneration } = await import('@/lib/services/generate-batch-predictions')
    
    //await runBatchPredictionGeneration()

    await runBatchPredictionGeneration(
      {
        topMarketsCount: 10,
        endDateRangeHours: 12,
        targetDaysFromNow: 7
      },
      'google/gemini-2.5-pro'
    )

    console.log('Batch prediction generation completed successfully!')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main() 