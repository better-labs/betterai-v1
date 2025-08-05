#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { sql as drizzleSql } from 'drizzle-orm'
import { events } from '../lib/db/schema'
import { mapTagsToCategory } from '../lib/categorize'

// Load environment variables
config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const neonSql = neon(connectionString)
const db = drizzle(neonSql)

async function populateCategories() {
  console.log('Starting category population for existing events...')
  
  try {
    // Get all events that don't have a category set
    const eventsWithoutCategory = await db
      .select({
        id: events.id,
        title: events.title,
        tags: events.tags
      })
      .from(events)
      .where(drizzleSql`${events.category} IS NULL`)

    console.log(`Found ${eventsWithoutCategory.length} events without categories`)

    if (eventsWithoutCategory.length === 0) {
      console.log('All events already have categories assigned')
      return
    }

    let updatedCount = 0
    let skippedCount = 0

    for (const event of eventsWithoutCategory) {
      try {
        // Extract tag labels from the tags array
        const tags = event.tags || []
        const tagLabels = Array.isArray(tags) 
          ? tags.map(tag => typeof tag === 'string' ? tag : (tag as any).label || '')
          : []

        // Calculate category based on tags
        const category = mapTagsToCategory(tagLabels)

        // Update the event with the calculated category
        await db
          .update(events)
          .set({ 
            category: category,
            updatedAt: new Date()
          })
          .where(drizzleSql`${events.id} = ${event.id}`)

        updatedCount++
        console.log(`✅ Updated event "${event.title}" with category ${category}`)
      } catch (error) {
        console.error(`❌ Failed to update event "${event.title}":`, (error as Error).message)
        skippedCount++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Successfully updated: ${updatedCount} events`)
    console.log(`❌ Failed to update: ${skippedCount} events`)
    console.log(`📝 Total processed: ${updatedCount + skippedCount} events`)

  } catch (error) {
    console.error('❌ Error during category population:', error)
    process.exit(1)
  } finally {
    // Neon serverless doesn't need explicit connection closing
  }
}

// Run the migration
populateCategories()
  .then(() => {
    console.log('🎉 Category population completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Category population failed:', error)
    process.exit(1)
  }) 