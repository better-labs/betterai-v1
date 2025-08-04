#!/usr/bin/env node

import { sql as drizzleSql } from 'drizzle-orm'
import { events } from '../lib/db/schema'
import { CATEGORIES } from '../lib/categorize'
import { initializeDatabase, runDatabaseOperation, handleScriptCompletion } from './db-utils'

const db = initializeDatabase()

async function getTopEventsByCategory() {
  console.log('🏆 Top Events by Category (by Volume)\n')
  
  return runDatabaseOperation(async () => {
    // Get all categories that have events
    const categoryStats = await db
      .select({
        category: events.category,
        count: drizzleSql<number>`count(*)::int`
      })
      .from(events)
      .where(drizzleSql`${events.category} IS NOT NULL`)
      .groupBy(events.category)
      .orderBy(events.category)

    for (const stat of categoryStats) {
      const categoryId = stat.category!
      const categoryName = CATEGORIES[categoryId as keyof typeof CATEGORIES]
      
      console.log(`📊 ${categoryName} (Category ${categoryId}) - ${stat.count} events`)
      console.log('─'.repeat(60))

      // Get top 5 events for this category by volume
      const topEvents = await db
        .select({
          id: events.id,
          title: events.title,
          volume: events.volume,
          trendingRank: events.trendingRank
        })
        .from(events)
        .where(drizzleSql`${events.category} = ${categoryId}`)
        .orderBy(drizzleSql`CAST(${events.volume} AS DECIMAL) DESC`)
        .limit(5)

      if (topEvents.length === 0) {
        console.log('   No events found\n')
        continue
      }

      // Calculate total volume for this category
      const totalVolume = await db
        .select({
          totalVolume: drizzleSql<string>`SUM(CAST(${events.volume} AS DECIMAL))`
        })
        .from(events)
        .where(drizzleSql`${events.category} = ${categoryId}`)

      const categoryTotalVolume = parseFloat(totalVolume[0]?.totalVolume || '0')

      for (let i = 0; i < topEvents.length; i++) {
        const event = topEvents[i]
        const volume = parseFloat(event.volume || '0')
        const volumeFormatted = volume.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
        const volumePercent = categoryTotalVolume > 0 
          ? ((volume / categoryTotalVolume) * 100).toFixed(1)
          : '0.0'
        
        const rank = event.trendingRank ? `#${event.trendingRank}` : 'N/A'
        
        console.log(`   ${i + 1}. ${event.title}`)
        console.log(`      💰 Volume: $${volumeFormatted} (${volumePercent}% of category)`)
        console.log(`      🏆 Trending Rank: ${rank}`)
        console.log('')
      }

      console.log(`   📈 Category Total Volume: $${categoryTotalVolume.toLocaleString('en-US')}`)
      console.log('')
    }

    // Show overall statistics
    console.log('📊 Overall Statistics')
    console.log('─'.repeat(60))
    
    const overallStats = await db
      .select({
        totalEvents: drizzleSql<number>`count(*)::int`,
        totalVolume: drizzleSql<string>`SUM(CAST(${events.volume} AS DECIMAL))`,
        avgVolume: drizzleSql<string>`AVG(CAST(${events.volume} AS DECIMAL))`
      })
      .from(events)
      .where(drizzleSql`${events.category} IS NOT NULL`)

    const stats = overallStats[0]
    if (stats) {
      const totalVolume = parseFloat(stats.totalVolume || '0')
      const avgVolume = parseFloat(stats.avgVolume || '0')
      
      console.log(`   Total Events: ${stats.totalEvents}`)
      console.log(`   Total Volume: $${totalVolume.toLocaleString('en-US')}`)
      console.log(`   Average Volume: $${avgVolume.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`)
    }
  }, 'fetching top events by category')
}

// Run the script
const { onSuccess, onError } = handleScriptCompletion('Top events by category analysis completed!')

getTopEventsByCategory()
  .then(onSuccess)
  .catch(onError) 