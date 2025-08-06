import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import dotenv from "dotenv"

// Configure dotenv to load environment variables (quietly)
dotenv.config({ path: '.env.local', quiet: true })

if (!process.env.DATABASE_URL) {
  throw new Error("Missing env.DATABASE_URL - Please add your Neon database connection string")
}

// Create Neon HTTP client with warning suppression
const sql = neon(process.env.DATABASE_URL, {
  disableWarningInBrowsers: true
})

// Initialize Drizzle with Neon client and schema
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export * from "./schema"
