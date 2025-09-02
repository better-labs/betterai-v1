
import { getTopMarketsByVolumeAndEndDate } from '@/lib/services/generate-batch-predictions';
import { performMarketResearch } from '../lib/services/market-research-service';
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST, before any other imports
// Try .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), '.env.local'), quiet: true })
config({ path: resolve(process.cwd(), '.env'), quiet: true })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function main() {
  //const marketId = process.argv[2];

  
   
    
    // Get top markets by volume and end date
    const topMarkets = await getTopMarketsByVolumeAndEndDate()
    
    if (topMarkets.length === 0) {
      console.log('No markets found matching the criteria')
      return
    }

    // Extract market IDs
    const marketId = topMarkets[0].id
    

  console.log(`Performing market research for market ID: ${marketId}`);
  console.log(`Market question: ${topMarkets[0].question}`);

  //const result = await performMarketResearch(marketId, 'openai/gpt-oss-120b');
  const result = await performMarketResearch(marketId, 'anthropic/claude-opus-4.1');

  if (result.success) {
    console.log('Market research successful:');
    console.log(JSON.stringify(result.research, null, 2));
  } else {
    console.error(`Market research failed: ${result.message}`);
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
