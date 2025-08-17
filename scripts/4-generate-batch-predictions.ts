#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST, before any other imports
// Try .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

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
        endDateRangeHours: 48,
        targetDaysFromNow: 7,
        categoryMix: true
      },
      'google/gemini-2.5-flash'
      //'google/gemini-2.0-flash-001'
    )

    console.log('Batch prediction generation completed successfully!')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main() 