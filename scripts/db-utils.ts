#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import path from 'path'

/**
 * Initialize database connection with proper environment variable loading
 * @returns Drizzle database instance
 */
export function initializeDatabase() {
  // Load environment variables from the root directory
  config({ path: path.join(__dirname, '..', '.env.local') })

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const neonSql = neon(connectionString)
  return drizzle(neonSql)
}

/**
 * Common error handling wrapper for database operations
 * @param operation Function to execute
 * @param operationName Name of the operation for error messages
 */
export async function runDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(`❌ Error in ${operationName}:`, error)
    process.exit(1)
  }
}

/**
 * Common script completion handler
 * @param successMessage Message to display on success
 */
export function handleScriptCompletion(successMessage: string) {
  return {
    onSuccess: () => {
      console.log(`✅ ${successMessage}`)
      process.exit(0)
    },
    onError: (error: any) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    }
  }
} 