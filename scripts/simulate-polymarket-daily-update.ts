#!/usr/bin/env node

/**
 * Simulation script to estimate daily Polymarket events count
 * Tests how many events would be fetched in a typical daily update
 * WITHOUT saving to database - just counts and times the operation
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function simulatePolymarketDailyUpdate() {
  console.log('🧪 SIMULATION: Daily Polymarket Update Event Count')
  console.log('================================================')
  
  const startTime = Date.now()
  
  try {
    // Import the polymarket client functions
    const { fetchPolymarketEvents } = await import('../lib/services/polymarket-client')
    
    // Simulate daily update parameters (similar to production)
    const config = {
      batchSize: 50,
      delayMs: 1000, // 1 second delay between batches like production
      daysToFetchPast: 8, // Same as production POLYMARKET_UPDATE_DAYS_PAST
      sortBy: 'volume' as const,
      ascending: false,
      maxBatches: 50 // Safety limit to prevent infinite loop
    }
    
    console.log(`📊 Simulation Parameters:`)
    console.log(`   - Batch Size: ${config.batchSize} events per batch`)
    console.log(`   - Days Back: ${config.daysToFetchPast} days`)
    console.log(`   - Sort By: ${config.sortBy}`)
    console.log(`   - Max Batches: ${config.maxBatches}`)
    console.log('')
    
    let totalEvents = 0
    let totalMarkets = 0
    let batchCount = 0
    let offset = 0
    let fetchTime = 0
    let processTime = 0
    
    // Calculate date range
    const now = new Date()
    const pastDate = new Date(now.getTime() - config.daysToFetchPast * 24 * 60 * 60 * 1000)
    const startDateMin = pastDate.toISOString().split('T')[0] // YYYY-MM-DD format
    
    console.log(`🗓️  Fetching events from ${startDateMin} to present`)
    console.log('')
    
    while (batchCount < config.maxBatches) {
      batchCount++
      console.log(`🔄 Batch ${batchCount}: Fetching ${config.batchSize} events (offset ${offset})...`)
      
      const batchStartTime = Date.now()
      
      try {
        // Fetch events from Polymarket API
        const fetchStart = Date.now()
        const events = await fetchPolymarketEvents(
          offset,
          config.batchSize,
          startDateMin,
          null, // endDateMax
          {
            maxRetries: 3,
            retryDelayMs: 2000,
            timeoutMs: 30000,
            userAgent: "BetterAI-Simulation/1.0"
          },
          config.sortBy
        )
        const fetchEnd = Date.now()
        fetchTime += (fetchEnd - fetchStart)
        
        if (!events || events.length === 0) {
          console.log(`   ✅ No more events found - stopping at batch ${batchCount}`)
          break
        }
        
        // Count markets in this batch (simulating processing time)
        const processStart = Date.now()
        let batchMarkets = 0
        for (const event of events) {
          if (event.markets) {
            batchMarkets += event.markets.length
          }
        }
        const processEnd = Date.now()
        processTime += (processEnd - processStart)
        
        totalEvents += events.length
        totalMarkets += batchMarkets
        offset += events.length
        
        const batchTime = Date.now() - batchStartTime
        console.log(`   📈 Found ${events.length} events, ${batchMarkets} markets (${batchTime}ms)`)
        
        // Respect the delay between batches
        if (config.delayMs > 0 && batchCount < config.maxBatches) {
          await new Promise(resolve => setTimeout(resolve, config.delayMs))
        }
        
        // If we got fewer events than requested, we've reached the end
        if (events.length < config.batchSize) {
          console.log(`   ✅ Reached end of results - stopping at batch ${batchCount}`)
          break
        }
        
      } catch (error) {
        console.error(`   ❌ Error in batch ${batchCount}:`, error instanceof Error ? error.message : error)
        break
      }
    }
    
    const totalTime = Date.now() - startTime
    const avgTimePerBatch = totalTime / batchCount
    const avgEventsPerBatch = totalEvents / batchCount
    const avgMarketsPerBatch = totalMarkets / batchCount
    
    console.log('')
    console.log('📊 SIMULATION RESULTS')
    console.log('====================')
    console.log(`Total Events Found: ${totalEvents}`)
    console.log(`Total Markets Found: ${totalMarkets}`)
    console.log(`Total Batches: ${batchCount}`)
    console.log(`Total Time: ${totalTime}ms (${Math.round(totalTime/1000)}s)`)
    console.log(`Average Time per Batch: ${Math.round(avgTimePerBatch)}ms`)
    console.log(`Average Events per Batch: ${Math.round(avgEventsPerBatch)}`)
    console.log(`Average Markets per Batch: ${Math.round(avgMarketsPerBatch)}`)
    console.log('')
    console.log('⏱️  TIME BREAKDOWN')
    console.log('==================')
    console.log(`API Fetch Time: ${fetchTime}ms (${Math.round(fetchTime/totalTime*100)}%)`)
    console.log(`Processing Time: ${processTime}ms (${Math.round(processTime/totalTime*100)}%)`)
    console.log(`Delay Time: ${Math.max(0, totalTime - fetchTime - processTime)}ms (${Math.round(Math.max(0, totalTime - fetchTime - processTime)/totalTime*100)}%)`)
    console.log('')
    
    // Estimate timeout risk
    console.log('⚠️  TIMEOUT ANALYSIS')
    console.log('====================')
    const projectedTimeFor60s = Math.ceil(60000 / avgTimePerBatch)
    const projectedTimeFor300s = Math.ceil(300000 / avgTimePerBatch)
    
    console.log(`Batches possible in 60s: ~${projectedTimeFor60s} (${projectedTimeFor60s * avgEventsPerBatch} events)`)
    console.log(`Batches possible in 300s: ~${projectedTimeFor300s} (${projectedTimeFor300s * avgEventsPerBatch} events)`)
    console.log(`Current workload needs: ${Math.round(totalTime/1000)}s`)
    
    if (totalTime > 60000) {
      console.log('🚨 RISK: Current workload exceeds 60s Vercel timeout!')
    } else {
      console.log('✅ OK: Current workload fits within 60s timeout')
    }
    
    if (totalTime > 300000) {
      console.log('🚨 RISK: Current workload exceeds even 300s timeout!')
    }
    
    return {
      totalEvents,
      totalMarkets, 
      totalBatches: batchCount,
      totalTimeMs: totalTime,
      avgTimePerBatch,
      avgEventsPerBatch,
      avgMarketsPerBatch,
      timeoutRisk60s: totalTime > 60000,
      timeoutRisk300s: totalTime > 300000
    }
    
  } catch (error) {
    console.error('❌ Simulation failed:', error)
    throw error
  }
}

// Run simulation if called directly
if (require.main === module) {
  simulatePolymarketDailyUpdate()
    .then((results) => {
      console.log('✅ Simulation completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Simulation failed:', error)
      process.exit(1)
    })
}

export { simulatePolymarketDailyUpdate }