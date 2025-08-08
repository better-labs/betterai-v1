
import { marketQueries } from '../lib/db/queries';
import { runDataPipeline } from '../lib/services/run-data-pipeline';


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

    const topMarkets = await marketQueries.getTopMarkets(20);

    if (topMarkets.length === 0) {
      console.log('No markets found.');
      return;
    }

    const randomMarket = topMarkets[Math.floor(Math.random() * topMarkets.length)];

    console.log(`Selected market: ${randomMarket.question} (ID: ${randomMarket.id})`);

    const result = await runDataPipeline(randomMarket.id);

    console.log('Data pipeline result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error running data pipeline script:', error);
  }
}

main();
