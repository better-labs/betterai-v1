
import { marketQueries } from '../lib/db/queries';
import { runDataPipeline } from '../lib/services/run-data-pipeline';
import { getTopMarketsByVolumeAndEndDate } from '../lib/services/generate-batch-predictions';

import { config } from 'dotenv'

// Load environment variables FIRST, before any other imports
config()

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}


async function main() {
  console.log('Running data pipeline for a random top market...');

  try {

    //const topMarkets = await marketQueries.getTopMarkets(10);
    const config = {
      topMarketsCount: 15,
      endDateRangeHours: 24,
      targetDaysFromNow: 7,
      categoryMix: true
    }
    const topMarkets = await getTopMarketsByVolumeAndEndDate(config);

    if (topMarkets.length === 0) {
      console.log('No markets found.');
      return;
    }

    const randomMarket = topMarkets[Math.floor(Math.random() * topMarkets.length)];
    console.log(`Selected market: ${randomMarket.question} (ID: ${randomMarket.id})`);
    const result = await runDataPipeline(randomMarket.id);

    // run data pipeline for each market
    for (const market of topMarkets) {
      //const result = await runDataPipeline(market.id);
      const result = await runDataPipeline(market.id, 'google/gemini-2.5-pro');
      console.log(`Data pipeline result for market ${market.question}:`);
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('Error running data pipeline script:', error);
  }
}

main();
