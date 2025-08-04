#!/usr/bin/env node

import { updatePolymarketAllEventsAndMarketData } from '../lib/data/events'
import { runDatabaseOperation, handleScriptCompletion } from './db-utils'

async function updateMarketEndDates() {
  console.log('🔄 Updating market data with end dates...\n')
  
  return runDatabaseOperation(async () => {
    const result = await updatePolymarketAllEventsAndMarketData()
    
    console.log('✅ Market data update completed!')
    console.log(`📊 Updated ${result.insertedEvents.length} events`)
    console.log(`📊 Updated ${result.insertedMarkets.length} markets`)
    console.log('\n💡 The end_date field should now be populated for markets.')
    console.log('💡 Run the top-markets-by-volume.ts script to see the results!')
  }, 'updating market data')
}

// Run the script
const { onSuccess, onError } = handleScriptCompletion('Market end dates update completed!')

updateMarketEndDates()
  .then(onSuccess)
  .catch(onError) 