#!/usr/bin/env node

import { sql as drizzleSql } from 'drizzle-orm'
import { events } from '../lib/db/schema'
import { CATEGORIES } from '../lib/categorize'
import { initializeDatabase, runDatabaseOperation, handleScriptCompletion } from './db-utils'

const db = initializeDatabase()

async function getTopEventByCategory() {
  console.log('🏆 Top Event by Category (by Volume)\n')
  
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

    const results: Array<{
      categoryId: number
      categoryName: string
      eventCount: number
      topEvent: {
        title: string
        volume: string
        volumeFormatted: string
      }
    }> = []

    for (const stat of categoryStats) {
      const categoryId = stat.category!
      const categoryName = CATEGORIES[categoryId as keyof typeof CATEGORIES]
      
      // Get top event for this category by volume
      const topEvent = await db
        .select({
          title: events.title,
          volume: events.volume
        })
        .from(events)
        .where(drizzleSql`${events.category} = ${categoryId}`)
        .orderBy(drizzleSql`CAST(${events.volume} AS DECIMAL) DESC`)
        .limit(1)

      if (topEvent.length > 0) {
        const event = topEvent[0]
        const volume = parseFloat(event.volume || '0')
        const volumeFormatted = volume.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })

        results.push({
          categoryId,
          categoryName,
          eventCount: stat.count,
          topEvent: {
            title: event.title,
            volume: event.volume || '0',
            volumeFormatted
          }
        })
      }
    }

    // Sort by volume (highest first)
    results.sort((a, b) => parseFloat(b.topEvent.volume) - parseFloat(a.topEvent.volume))

    // Display results
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const rank = i + 1
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
      
      console.log(`${emoji} ${result.categoryName} (${result.eventCount} events)`)
      console.log(`   📊 ${result.topEvent.title}`)
      console.log(`   💰 Volume: $${result.topEvent.volumeFormatted}`)
      console.log('')
    }

    // Summary
    const totalVolume = results.reduce((sum, result) => sum + parseFloat(result.topEvent.volume), 0)
    console.log('📈 Summary')
    console.log('─'.repeat(50))
    console.log(`Total Categories: ${results.length}`)
    console.log(`Total Volume (Top Events): $${totalVolume.toLocaleString('en-US')}`)
    console.log(`Average Volume per Category: $${(totalVolume / results.length).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`)
  }, 'fetching top events by category')
}

// Run the script
const { onSuccess, onError } = handleScriptCompletion('Top event by category analysis completed!')

getTopEventByCategory()
  .then(onSuccess)
  .catch(onError) 