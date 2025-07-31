import type { Config } from "drizzle-kit"
import { config } from "dotenv"

// Load environment variables from .env.local
config({ path: ".env.local" })

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
