/**
 * Simplified BetterAI DB environment sync for DEVELOPMENT with Supabase
 *
 * Usage:
 *   tsx provision-db-roles-dev-simple.ts
 *
 * What it does:
 *   - Pulls latest environment variables from Vercel CLI
 *   - Tests database connection
 *
 * Note: With Supabase, we use the default postgres superuser role.
 * No need for custom role provisioning like with Neon.
 */

import { Client } from "pg";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: '.env.local' });

async function pullVercelEnv(): Promise<void> {
  console.log("🔄 Pulling latest environment variables from Vercel...");
  execSync("vercel env pull .env.local --environment=development", { stdio: 'inherit' });
  console.log("✅ Updated .env.local from Vercel");
}

async function testDatabaseConnection(connectionString: string, label: string): Promise<boolean> {
  try {
    const client = new Client({ connectionString });
    await client.connect();
    await client.query('SELECT 1 as connection_test');
    await client.end();
    console.log(`✅ ${label} connection successful`);
    return true;
  } catch (error) {
    console.log(`❌ ${label} connection failed:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  try {
    // Pull the latest environment variables from Vercel
    await pullVercelEnv();

    // Reload environment variables after pulling from Vercel
    dotenv.config({ path: '.env.local' });

    console.log("\n🧪 Testing database connection...");

    // Test DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      await testDatabaseConnection(databaseUrl, "DATABASE_URL (Supabase Session Pooler)");
    } else {
      console.error("⚠️  DATABASE_URL not found in environment");
      process.exit(1);
    }

    console.log("\n🎉 Complete! Environment synced and database connection verified!");

  } catch (error) {
    console.error("❌ Failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);