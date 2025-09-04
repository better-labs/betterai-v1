
/**
 * Provision BetterAI DB roles for DEVELOPMENT environments (preserves existing passwords).
 *
 * Usage:
 *   Set DATABASE_URL_NEONDB_OWNER in .env.local, then run:
 *   ts-node provision-db-roles-dev.ts
 *   
 * Options:
 *   --generate-new-passwords : Force generation of new passwords even for existing roles
 *   --update-vercel-env      : Automatically update Vercel development environment variables
 *
 * DEVELOPMENT FOCUSED:
 *   - Does NOT rotate passwords if roles already exist (dev-friendly)
 *   - Only creates new passwords when creating new roles
 *   - Use a production-focused script for password rotation in prod environments
 *
 * What it does:
 *   - Validates the input URL includes 'neondb_owner' and '-pooler'
 *   - Derives the **direct (non-pooler)** host
 *   - Creates or updates:
 *       - betterai_admin  (DDL / migrations) - preserves existing password
 *       - betterai_app    (CRUD / runtime) - preserves existing password
 *   - Grants least-privilege on all existing schemas (excl. pg_catalog, information_schema, pg_toast, temp schemas)
 *   - Sets **comprehensive default privileges** so future tables/sequences automatically inherit correct grants:
 *       - neondb_owner grants to both betterai_admin and betterai_app
 *       - betterai_admin grants CRUD access to betterai_app
 *       - betterai_app grants full access to betterai_admin
 *   - Prints:
 *       - DATABASE_URL              (pooled, app role for runtime)
 *       - DATABASE_URL_UNPOOLED     (direct, admin role for migrations/DDL)
 */

import { Client } from "pg";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function logError(operation: string, error: any): void {
  console.error(`❌ Failed during: ${operation}`);
  console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  if (error instanceof Error && error.stack) {
    console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
  }
}

async function executeQuery(client: Client, operation: string, query: string, params?: any[]): Promise<any> {
  try {
    console.log(`🔄 ${operation}...`);
    const result = await client.query(query, params);
    console.log(`✅ ${operation} - Success`);
    return result;
  } catch (error) {
    logError(operation, error);
    throw error;
  }
}

async function executeQuerySafe(client: Client, operation: string, query: string, params?: any[]): Promise<boolean> {
  try {
    console.log(`🔄 ${operation}...`);
    await client.query(query, params);
    console.log(`✅ ${operation} - Success`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('permission denied') || errorMsg.includes('must be owner')) {
      console.log(`⚠️  ${operation} - Skipped (insufficient permissions)`);
      return false;
    }
    logError(operation, error);
    throw error;
  }
}

function genPassword(bytes = 48): string {
  // URL-safe base64 (no '+' or '/'); keep it simple for copy/paste & .env
  if (bytes < 32) bytes = 32;
  return crypto.randomBytes(bytes).toString("base64url");
}

function buildUrl(
  base: URL,
  {
    username,
    password,
    host,
  }: { username: string; password: string; host: string }
): string {
  const u = new URL(base.toString());
  u.username = encodeURIComponent(username);
  u.password = encodeURIComponent(password);
  u.host = host; // preserves port if present
  return u.toString();
}

async function updateVercelEnvVar(varName: string, value: string): Promise<void> {
  try {
    console.log(`🔄 Updating Vercel env var: ${varName}...`);
    
    // Use echo to pipe the value to vercel env add to avoid interactive prompts
    const command = `echo "${value}" | vercel env add ${varName} development --force`;
    execSync(command, { stdio: ['pipe', 'pipe', 'inherit'] });
    
    console.log(`✅ Successfully updated ${varName} in Vercel development environment`);
  } catch (error) {
    console.error(`❌ Failed to update ${varName} in Vercel:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function main() {
  const input = process.env.DATABASE_URL_NEONDB_OWNER;
  if (!input) fatal("DATABASE_URL_NEONDB_OWNER environment variable is required in .env.local");
  
  // Check for --generate-new-passwords flag
  const forceNewPasswords = process.argv.includes('--generate-new-passwords');
  if (forceNewPasswords) {
    console.log("🔄 --generate-new-passwords flag detected: Will generate new passwords for all roles");
  }

  // Check for --update-vercel-env flag
  const updateVercelEnv = process.argv.includes('--update-vercel-env');
  if (updateVercelEnv) {
    console.log("🔄 --update-vercel-env flag detected: Will update Vercel development environment variables");
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    fatal("Invalid URL.");
  }

  if (!/^postgres(ql)?:$/.test(url.protocol))
    fatal("URL must start with postgres:// or postgresql://");

  // Must be the owner user (Neon defaults to neondb_owner for bootstrap)
  if (decodeURIComponent(url.username) !== "neondb_owner") {
    fatal("URL must authenticate as 'neondb_owner'.");
  }

  // Must be a pooler host
  const pooledHost = url.host;
  if (!pooledHost.includes("-pooler")) {
    fatal("URL host must include '-pooler' (pooled endpoint).");
  }

  // Derive the direct (non-pooler) host
  const directHost = pooledHost.replace("-pooler", "");

  // Build a direct URL for owner connection (same owner creds)
  const ownerDirectUrl = buildUrl(url, {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: directHost,
  });

  // Connect as owner on the **direct** endpoint so DDL works reliably
  const adminClient = new Client({ connectionString: ownerDirectUrl });
  try {
    await adminClient.connect();
    console.log("✓ Connected to database as neondb_owner (direct endpoint)");
  } catch (err) {
    fatal(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Helpers
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName) fatal("Database name missing in URL path.");
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
    fatal("Database name contains invalid characters. Use only letters, numbers, and underscores.");
  }

  // Check if roles already exist to preserve passwords in dev environments
  const { rows: existingRoles } = await executeQuery(adminClient, "Checking existing roles", `
    SELECT rolname 
    FROM pg_roles 
    WHERE rolname IN ('betterai_admin', 'betterai_app')
  `);
  
  const adminExists = existingRoles.some((r: { rolname: string }) => r.rolname === 'betterai_admin');
  const appExists = existingRoles.some((r: { rolname: string }) => r.rolname === 'betterai_app');
  
  // Generate new passwords based on existence and flag
  const appPwd = (!appExists || forceNewPasswords) ? genPassword() : null;
  const adminPwd = (!adminExists || forceNewPasswords) ? genPassword() : null;
  
  console.log(`📋 Role status: admin=${adminExists ? (adminPwd ? 'exists (new password)' : 'exists (password preserved)') : 'new'}, app=${appExists ? (appPwd ? 'exists (new password)' : 'exists (password preserved)') : 'new'}`);

  try {
    // Ensure pgcrypto for any future SQL-side generation if you use it later
    await executeQuery(adminClient, "Creating pgcrypto extension", 
      `CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    
    // Store as SCRAM in case instance defaults differ
    await executeQuery(adminClient, "Setting password encryption to SCRAM-SHA-256", 
      `SET password_encryption = 'scram-sha-256';`);

    // Upsert roles (CREATE new roles only, preserve existing passwords in dev)
    // betterai_admin (DDL/migrations)
    if (adminPwd) {
      const adminPwdEscaped = adminPwd.replace(/'/g, "''");
      if (!adminExists) {
        await executeQuery(adminClient, "Creating betterai_admin role with new password", `
          CREATE ROLE betterai_admin LOGIN PASSWORD '${adminPwdEscaped}';
        `);
      } else {
        await executeQuery(adminClient, "Updating betterai_admin password", `
          ALTER ROLE betterai_admin WITH LOGIN PASSWORD '${adminPwdEscaped}';
        `);
      }
    } else {
      await executeQuery(adminClient, "Ensuring betterai_admin role has LOGIN privilege", `
        ALTER ROLE betterai_admin WITH LOGIN;
      `);
    }

    // betterai_app (CRUD/runtime)
    if (appPwd) {
      const appPwdEscaped = appPwd.replace(/'/g, "''");
      if (!appExists) {
        await executeQuery(adminClient, "Creating betterai_app role with new password", `
          CREATE ROLE betterai_app LOGIN PASSWORD '${appPwdEscaped}';
        `);
      } else {
        await executeQuery(adminClient, "Updating betterai_app password", `
          ALTER ROLE betterai_app WITH LOGIN PASSWORD '${appPwdEscaped}';
        `);
      }
    } else {
      await executeQuery(adminClient, "Ensuring betterai_app role has LOGIN privilege", `
        ALTER ROLE betterai_app WITH LOGIN;
      `);
    }

    // Ensure both roles can CONNECT to the main DB
    await executeQuery(adminClient, "Granting CONNECT permission to roles", 
      `GRANT CONNECT ON DATABASE "${dbName.replace(/"/g, '""')}" TO betterai_admin, betterai_app;`
    );

    // Discover non-system schemas (including "public")
    const { rows: schemaRows } = await executeQuery(adminClient, "Discovering existing schemas", `
      SELECT nspname
      FROM pg_namespace
      WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND nspname NOT LIKE 'pg_temp_%'
        AND nspname NOT LIKE 'pg_toast_temp_%'
    `);

    const schemas = schemaRows.map((r: { nspname: string }) => r.nspname);
    if (schemas.length === 0) {
      // At least operate on "public" just in case
      schemas.push("public");
    }

    // Apply grants per schema on the main DB
    for (const s of schemas) {
      const ident = `"${s.replace(/"/g, '""')}"`;
      console.log(`\n📁 Processing schema: ${s}`);

      // Admin: full control over objects for migrations
      await executeQuerySafe(adminClient, `Granting USAGE on schema ${s} to betterai_admin`, 
        `GRANT USAGE ON SCHEMA ${ident} TO betterai_admin;`);
      await executeQuerySafe(adminClient, `Granting ALL on tables in schema ${s} to betterai_admin`, 
        `GRANT ALL ON ALL TABLES IN SCHEMA ${ident} TO betterai_admin;`);
      await executeQuerySafe(adminClient, `Granting ALL on sequences in schema ${s} to betterai_admin`, 
        `GRANT ALL ON ALL SEQUENCES IN SCHEMA ${ident} TO betterai_admin;`);
      await executeQuerySafe(adminClient, `Setting default table privileges for neondb_owner in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT ALL ON TABLES TO betterai_admin;`);
      await executeQuerySafe(adminClient, `Setting default sequence privileges for neondb_owner in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT ALL ON SEQUENCES TO betterai_admin;`);

      // App: CRUD only, no DDL
      await executeQuerySafe(adminClient, `Granting USAGE on schema ${s} to betterai_app`, 
        `GRANT USAGE ON SCHEMA ${ident} TO betterai_app;`);
      await executeQuerySafe(adminClient, `Granting CRUD on tables in schema ${s} to betterai_app`, 
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${ident} TO betterai_app;`);
      await executeQuerySafe(adminClient, `Granting USAGE on sequences in schema ${s} to betterai_app`, 
        `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${ident} TO betterai_app;`);
      await executeQuerySafe(adminClient, `Setting default table CRUD privileges for neondb_owner in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;`);
      await executeQuerySafe(adminClient, `Setting default sequence USAGE privileges for neondb_owner in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;`);

      // Cross-role default privileges for future-proof permissions
      await executeQuerySafe(adminClient, `Setting cross-role table privileges for betterai_admin in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA ${ident}
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;`);
      await executeQuerySafe(adminClient, `Setting cross-role sequence privileges for betterai_admin in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA ${ident}
        GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;`);
      await executeQuerySafe(adminClient, `Setting cross-role table privileges for betterai_app in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_app IN SCHEMA ${ident}
        GRANT ALL ON TABLES TO betterai_admin;`);
      await executeQuerySafe(adminClient, `Setting cross-role sequence privileges for betterai_app in schema ${s}`, 
        `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_app IN SCHEMA ${ident}
        GRANT ALL ON SEQUENCES TO betterai_admin;`);
    }


    // Construct output URLs
    if (appPwd || adminPwd) {
      // Show URLs with new passwords (only for roles that got new passwords)
      console.log("\n# === Copy these to your env store ===");
      
      let pooledAppUrl = "";
      let directAdminUrl = "";

      if (appPwd) {
        pooledAppUrl = buildUrl(url, {
          username: "betterai_app",
          password: appPwd,
          host: pooledHost, // keep -pooler for app runtime
        });
        console.log(`DATABASE_URL=${pooledAppUrl}`);                // pooled, app role (runtime)
      }

      if (adminPwd) {
        // Direct (non-pooled) admin URL for migrations/DDL
        directAdminUrl = buildUrl(url, {
          username: "betterai_admin",
          password: adminPwd,
          host: directHost, // remove -pooler
        });

        console.log(`DATABASE_URL_UNPOOLED=${directAdminUrl}`);     // direct, admin role (migrations/DDL)
      }

      // Update Vercel environment variables if flag is set
      if (updateVercelEnv && (appPwd || adminPwd)) {
        console.log("\n🔄 Updating Vercel development environment variables...");
        
        try {
          if (appPwd && pooledAppUrl) {
            await updateVercelEnvVar("DATABASE_URL", pooledAppUrl);
          }
          
          if (adminPwd && directAdminUrl) {
            await updateVercelEnvVar("DATABASE_URL_UNPOOLED", directAdminUrl);
          }
          
          console.log("✅ Successfully updated Vercel environment variables");
        } catch (error) {
          console.error("⚠️  Failed to update some Vercel environment variables. You may need to update them manually:");
          console.error("   Run: vercel env add DATABASE_URL development");
          console.error("   Run: vercel env add DATABASE_URL_UNPOOLED development");
        }
      }
    } else {
      // Existing roles - passwords preserved, URLs unchanged
      console.log("\n📋 Existing roles detected - passwords preserved for development.");
      console.log("💡 Your existing DATABASE_URL and DATABASE_URL_UNPOOLED remain valid.");
      console.log("   No need to update environment variables.");
      
      if (!appPwd && !adminPwd) {
        console.log("   Both admin and app roles existed - all passwords preserved.");
      } else if (!appPwd) {
        console.log("   App role existed - app password preserved, admin password was updated.");
      } else if (!adminPwd) {
        console.log("   Admin role existed - admin password preserved, app password was updated.");
      }
    }

    console.log("\n🎉 Done. Roles created/updated and grants applied.");
  } catch (err) {
    console.error("\n💥 Provisioning failed!");
    logError("Overall provisioning process", err);
    console.error("\n🔍 Troubleshooting tips:");
    console.error("   - Ensure you're using the correct neondb_owner URL with pooler endpoint");
    console.error("   - Check that the database user has sufficient privileges");
    console.error("   - Verify network connectivity to the database");
    console.error("   - Some permission errors may be expected and are handled gracefully");
    process.exitCode = 1;
  } finally {
    await adminClient.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});