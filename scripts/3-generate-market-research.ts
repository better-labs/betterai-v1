
import { getTopMarketsByVolumeAndEndDate } from '@/lib/services/generate-batch-predictions';
import { performMarketResearch } from '../lib/services/market-research-service';
import { config } from 'dotenv'
import { resolve } from 'path'
import {AI_MODELS} from '@/lib/config/ai-models'

// Load environment variables FIRST, before any other imports
// Try .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function main() {
  const numMarketsArg = process.argv[2];
  const numMarkets = numMarketsArg ? parseInt(numMarketsArg, 10) : 1;

  if (isNaN(numMarkets) || numMarkets <= 0) {
    console.error('Number of markets must be a positive integer');
    process.exit(1);
  }

  console.log(`Performing market research for top ${numMarkets} markets`);
  
  // Get top markets by volume and end date
  const topMarkets = await getTopMarketsByVolumeAndEndDate({ topMarketsCount: numMarkets, endDateRangeHours: 48, targetDaysFromNow: 7 })
  
  if (topMarkets.length === 0) {
    console.log('No markets found matching the criteria')
    return
  }

  // Limit to requested number of markets
  const marketsToProcess = topMarkets.slice(0, numMarkets);
  const model = AI_MODELS[1].id;
  console.log(`Found ${topMarkets.length} markets, processing top ${marketsToProcess.length}`);


  for (const market of marketsToProcess) {
    console.log(`\n--- Performing market research for market ID: ${market.id} ---`);
    console.log('Using model: ', model);
    console.log(`Market question: ${market.question}`);

    try {
      //const result = await performMarketResearch(market.id, 'openai/gpt-oss-120b');
      const result = await performMarketResearch(market.id, model);

      if (result.success) {
        console.log('Market research successful:');
        console.log(JSON.stringify(result.research, null, 2));
      } else {
        console.error(`Market research failed: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error processing market ${market.id}:`, error);
    }
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
