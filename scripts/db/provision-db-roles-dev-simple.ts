/**
 * Simplified BetterAI DB roles provisioning for DEVELOPMENT
 * 
 * Usage:
 *   Set DATABASE_URL_NEONDB_OWNER in .env.local, then run:
 *   tsx provision-db-roles-dev-simple.ts [--update-vercel-env]
 * 
 * What it does:
 *   - Creates/updates betterai_app role with new password
 *   - Grants CRUD permissions on public schema
 *   - Outputs DATABASE_URL (pooled app) and DATABASE_URL_UNPOOLED (direct owner)
 *   - Optionally updates Vercel development environment
 */

import { Client } from "pg";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: '.env.local' });

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function genPassword(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

function buildUrl(base: URL, { username, password, host }: { username: string; password: string; host: string }): string {
  const u = new URL(base.toString());
  u.username = encodeURIComponent(username);
  u.password = encodeURIComponent(password);
  u.host = host;
  return u.toString();
}

async function updateVercelEnv(varName: string, value: string): Promise<void> {
  const command = `echo "${value}" | vercel env add ${varName} development --force`;
  execSync(command, { stdio: ['pipe', 'pipe', 'inherit'] });
  console.log(`✅ Updated ${varName} in Vercel`);
}

async function main() {
  const input = process.env.DATABASE_URL_NEONDB_OWNER;
  if (!input) fatal("DATABASE_URL_NEONDB_OWNER environment variable required");
  
  const updateVercelEnv = process.argv.includes('--update-vercel-env');
  
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    fatal("Invalid URL");
  }

  if (!/^postgres(ql)?:$/.test(url.protocol)) fatal("URL must be PostgreSQL");
  if (decodeURIComponent(url.username) !== "neondb_owner") fatal("URL must use neondb_owner");
  if (!url.host.includes("-pooler")) fatal("URL must use pooler endpoint");

  const pooledHost = url.host;
  const directHost = pooledHost.replace("-pooler", "");
  const dbName = url.pathname.replace(/^\//, "");
  
  // Connect as owner (direct endpoint)
  const ownerDirectUrl = buildUrl(url, {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: directHost,
  });
  
  const client = new Client({ connectionString: ownerDirectUrl });
  
  try {
    await client.connect();
    console.log("✓ Connected as neondb_owner");
    
    // Generate new password for app role
    const appPassword = genPassword();
    const appPasswordEscaped = appPassword.replace(/'/g, "''");
    
    // Create or update app role
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterai_app') THEN
          ALTER ROLE betterai_app WITH PASSWORD '${appPasswordEscaped}';
        ELSE
          CREATE ROLE betterai_app LOGIN PASSWORD '${appPasswordEscaped}';
        END IF;
      END $$;
    `);
    console.log("✅ Created/updated betterai_app role");
    
    // Grant basic permissions
    await client.query(`GRANT CONNECT ON DATABASE "${dbName}" TO betterai_app`);
    await client.query(`GRANT USAGE ON SCHEMA public TO betterai_app`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO betterai_app`);
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO betterai_app`);
    
    // Set default privileges for future objects
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app
    `);
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public  
      GRANT USAGE, SELECT ON SEQUENCES TO betterai_app
    `);
    console.log("✅ Granted permissions");
    
    // Build output URLs
    const appUrl = buildUrl(url, {
      username: "betterai_app",
      password: appPassword,
      host: pooledHost, // pooled for app
    });
    
    const ownerUrl = buildUrl(url, {
      username: decodeURIComponent(url.username), 
      password: decodeURIComponent(url.password),
      host: directHost, // direct for migrations
    });
    
    console.log("\n# === Environment Variables ===");
    console.log(`DATABASE_URL=${appUrl}`);
    console.log(`DATABASE_URL_UNPOOLED=${ownerUrl}`);
    
    // Update Vercel if requested
    if (updateVercelEnv) {
      console.log("\n🔄 Updating Vercel environment...");
      await updateVercelEnv("DATABASE_URL", appUrl);
      await updateVercelEnv("DATABASE_URL_UNPOOLED", ownerUrl);
    }
    
    console.log("\n🎉 Done!");
    
  } catch (error) {
    console.error("❌ Failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);