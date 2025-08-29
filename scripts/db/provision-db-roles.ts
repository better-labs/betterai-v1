
/**
 * Provision/rotate BetterAI DB roles, ensure a Neon shadow schema, and emit URLs.
 *
 * Usage:
 *   ts-node provision-db-roles.ts "postgres://neondb_owner:...@ep-xxxxx-pooler.us-east-1.aws.neon.tech/betterai_dev?sslmode=require"
 *
 * What it does:
 *   - Validates the input URL includes 'neondb_owner' and '-pooler'
 *   - Derives the **direct (non-pooler)** host
 *   - Creates or updates:
 *       - betterai_admin  (DDL / migrations)
 *       - betterai_app    (CRUD / runtime)
 *   - Grants least-privilege on all existing schemas (excl. pg_catalog, information_schema, pg_toast, temp schemas)
 *   - Sets **comprehensive default privileges** so future tables/sequences automatically inherit correct grants:
 *       - neondb_owner grants to both betterai_admin and betterai_app
 *       - betterai_admin grants CRUD access to betterai_app
 *       - betterai_app grants full access to betterai_admin
 *   - Ensures a **betterai_shadow** schema owned by betterai_admin with mirrored extensions
 *   - Prints:
 *       - DATABASE_URL              (pooled, app role)
 *       - DATABASE_URL_UNPOOLED     (direct, app role)
 *       - DATABASE_URL_UNPOOLED_SHADOW (direct, admin role, with schema=betterai_shadow)
 */

import { Client } from "pg";
import crypto from "crypto";

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

async function main() {
  const input = process.argv[2];
  if (!input) fatal("Provide a Neon connection URL as the first argument.");

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
  const shadowSchemaName = "betterai_shadow";

  // Generate new passwords
  const appPwd = genPassword();
  const adminPwd = genPassword();

  try {
    // Ensure pgcrypto for any future SQL-side generation if you use it later
    await executeQuery(adminClient, "Creating pgcrypto extension", 
      `CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    
    // Store as SCRAM in case instance defaults differ
    await executeQuery(adminClient, "Setting password encryption to SCRAM-SHA-256", 
      `SET password_encryption = 'scram-sha-256';`);

    // Upsert roles (CREATE or ALTER on duplicate)
    // betterai_admin (DDL/migrations)
    const adminPwdEscaped = adminPwd.replace(/'/g, "''");
    await executeQuery(adminClient, "Creating/updating betterai_admin role", `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterai_admin') THEN
        CREATE ROLE betterai_admin LOGIN PASSWORD '${adminPwdEscaped}';
      ELSE
        ALTER ROLE betterai_admin WITH LOGIN PASSWORD '${adminPwdEscaped}';
      END IF;
    END$$;`);

    // betterai_app (CRUD/runtime)
    const appPwdEscaped = appPwd.replace(/'/g, "''");
    await executeQuery(adminClient, "Creating/updating betterai_app role", `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterai_app') THEN
        CREATE ROLE betterai_app LOGIN PASSWORD '${appPwdEscaped}';
      ELSE
        ALTER ROLE betterai_app WITH LOGIN PASSWORD '${appPwdEscaped}';
      END IF;
    END$$;`);

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

    // --- Ensure shadow schema exists and is owned by betterai_admin ---
    console.log(`\n🌑 Setting up shadow schema: ${shadowSchemaName}`);
    
    const { rows: [{ exists: shadowSchemaExists }] } = await executeQuery(adminClient, 
      `Checking if shadow schema ${shadowSchemaName} exists`,
      `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1) AS exists`,
      [shadowSchemaName]
    );

    if (!shadowSchemaExists) {
      await executeQuery(adminClient, `Creating shadow schema ${shadowSchemaName}`, 
        `CREATE SCHEMA "${shadowSchemaName}" AUTHORIZATION betterai_admin`);
    } else {
      console.log(`✓ Shadow schema "${shadowSchemaName}" already exists`);
      // Ensure ownership is correct
      await executeQuerySafe(adminClient, `Ensuring shadow schema ${shadowSchemaName} ownership`, 
        `ALTER SCHEMA "${shadowSchemaName}" OWNER TO betterai_admin`);
    }

    // Grant permissions on shadow schema
    await executeQuerySafe(adminClient, `Granting ALL on shadow schema to betterai_admin`, 
      `GRANT ALL ON SCHEMA "${shadowSchemaName}" TO betterai_admin`);
    await executeQuerySafe(adminClient, `Granting USAGE on shadow schema to betterai_app`, 
      `GRANT USAGE ON SCHEMA "${shadowSchemaName}" TO betterai_app`);
    
    // Set default privileges for shadow schema
    await executeQuerySafe(adminClient, `Setting default table privileges in shadow schema`, 
      `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA "${shadowSchemaName}"
      GRANT ALL ON TABLES TO betterai_admin`);
    await executeQuerySafe(adminClient, `Setting default sequence privileges in shadow schema`, 
      `ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA "${shadowSchemaName}"
      GRANT ALL ON SEQUENCES TO betterai_admin`);

    console.log(`✅ Shadow schema "${shadowSchemaName}" setup completed`);

    // Construct output URLs
    const pooledAppUrl = buildUrl(url, {
      username: "betterai_app",
      password: appPwd,
      host: pooledHost, // keep -pooler for app runtime
    });

    // Direct (non-pooled) URLs
    const directAppUrl = buildUrl(url, {
      username: "betterai_app",
      password: appPwd,
      host: directHost, // remove -pooler
    });

    const directAdminUrl = buildUrl(url, {
      username: "betterai_admin",
      password: adminPwd,
      host: directHost,
    });

    const shadowAdminUrl = (() => {
      const u = new URL(directAdminUrl);
      u.searchParams.set('schema', shadowSchemaName);
      return u.toString();
    })();

    // Print as simple key=value lines ready for Vercel / .env
    console.log("\n# === Copy these to your env store ===");
    console.log(`DATABASE_URL=${pooledAppUrl}`);                // pooled, app role (runtime)
    console.log(`DATABASE_URL_UNPOOLED=${directAdminUrl}`);     // direct, admin role (migrations/DDL)
    console.log(`DATABASE_URL_UNPOOLED_SHADOW=${shadowAdminUrl}`); // direct, admin role, shadow schema

    console.log("\n🎉 Done. Roles created/updated, grants applied, and shadow schema ensured.");
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