#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'
import { DEFAULT_MODEL } from '@/lib/config/ai-models'

// Load environment variables FIRST, before any other imports
// Try .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), '.env.local') })


// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: { experimentTag?: string; experimentNotes?: string; modelName?: string } = {}
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--experiment-tag' && args[i + 1]) {
      parsed.experimentTag = args[i + 1]
      i++ // Skip next arg since we consumed it
    } else if (arg === '--experiment-notes' && args[i + 1]) {
      parsed.experimentNotes = args[i + 1]
      i++
    } else if (arg === '--model' && args[i + 1]) {
      parsed.modelName = args[i + 1]
      i++
    }
  }
  
  return parsed
}

async function main() {
  const { experimentTag, experimentNotes, modelName } = parseArgs()
  
  console.log('Starting batch prediction generation...')
  if (experimentTag) {
    console.log(`🧪 Experiment: ${experimentTag}`)
    if (experimentNotes) {
      console.log(`📝 Notes: ${experimentNotes}`)
    }
  }
  
  try {
    // Dynamically import the function after environment variables are loaded
    const { runBatchPredictionGeneration } = await import('@/lib/services/generate-batch-predictions')
    
    await runBatchPredictionGeneration(
      {
        topMarketsCount: 10,
        endDateRangeHours: 48,
        targetDaysFromNow: 7,
        categoryMix: true
      },
      modelName || DEFAULT_MODEL,
      {
        experimentTag,
        experimentNotes
      }
    )

    console.log('Batch prediction generation completed successfully!')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main() 