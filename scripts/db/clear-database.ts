#!/usr/bin/env node

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Load environment variables
config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function clearDatabase() {
  console.log('Connecting to database...')
  
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client)
  
  try {
    console.log('Clearing all tables...')
    
    // Get all table names from the database
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `
    
    if (tables.length === 0) {
      console.log('No tables found to clear')
      return
    }
    
    const tableNames = tables.map(t => t.tablename).join(', ')
    console.log(`Found tables: ${tableNames}`)
    
    // Truncate all tables with CASCADE to handle foreign key constraints
    await client`TRUNCATE TABLE ${client.unsafe(tableNames)} CASCADE`
    
    console.log('✅ All tables cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

clearDatabase() 