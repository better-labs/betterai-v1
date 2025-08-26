
/**
 * Provision/rotate BetterAI DB roles, ensure a Neon shadow DB, and emit URLs.
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
 *   - Ensures an empty **shadow DB** (dbName + "_shadow") owned by betterai_admin with mirrored extensions
 *   - Prints:
 *       - DATABASE_URL              (pooled, app role)
 *       - DATABASE_URL_UNPOOLED     (direct, app role)
 *       - SHADOW_DATABASE_URL       (direct, admin role, shadow DB)
 */

import { Client } from "pg";
import crypto from "crypto";

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
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
  const shadowDbName = `${dbName}_shadow`;

  // Generate new passwords
  const appPwd = genPassword();
  const adminPwd = genPassword();

  try {
    // Ensure pgcrypto for any future SQL-side generation if you use it later
    await adminClient.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    // Store as SCRAM in case instance defaults differ
    await adminClient.query(`SET password_encryption = 'scram-sha-256';`);

    // Upsert roles (CREATE or ALTER on duplicate)
    // betterai_admin (DDL/migrations)
    const adminPwdEscaped = adminPwd.replace(/'/g, "''");
    await adminClient.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterai_admin') THEN
        CREATE ROLE betterai_admin LOGIN PASSWORD '${adminPwdEscaped}';
      ELSE
        ALTER ROLE betterai_admin WITH LOGIN PASSWORD '${adminPwdEscaped}';
      END IF;
    END$$;`);

    // betterai_app (CRUD/runtime)
    const appPwdEscaped = appPwd.replace(/'/g, "''");
    await adminClient.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterai_app') THEN
        CREATE ROLE betterai_app LOGIN PASSWORD '${appPwdEscaped}';
      ELSE
        ALTER ROLE betterai_app WITH LOGIN PASSWORD '${appPwdEscaped}';
      END IF;
    END$$;`);

    // Ensure both roles can CONNECT to the main DB
    await adminClient.query(
      `GRANT CONNECT ON DATABASE "${dbName.replace(/"/g, '""')}" TO betterai_admin, betterai_app;`
    );

    // Discover non-system schemas (including "public")
    const { rows: schemaRows } = await adminClient.query<{ nspname: string }>(`
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

      // Admin: full control over objects for migrations
      await adminClient.query(`GRANT USAGE ON SCHEMA ${ident} TO betterai_admin;`);
      await adminClient.query(`GRANT ALL ON ALL TABLES IN SCHEMA ${ident} TO betterai_admin;`);
      await adminClient.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA ${ident} TO betterai_admin;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT ALL ON TABLES TO betterai_admin;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT ALL ON SEQUENCES TO betterai_admin;`);

      // App: CRUD only, no DDL
      await adminClient.query(`GRANT USAGE ON SCHEMA ${ident} TO betterai_app;`);
      await adminClient.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${ident} TO betterai_app;`);
      await adminClient.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${ident} TO betterai_app;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA ${ident}
        GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;`);

      // Cross-role default privileges for future-proof permissions
      // When betterai_admin creates objects, grant access to betterai_app
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA ${ident}
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE betterai_admin IN SCHEMA ${ident}
        GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;`);

      // When betterai_app creates objects, grant access to betterai_admin
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE betterai_app IN SCHEMA ${ident}
        GRANT ALL ON TABLES TO betterai_admin;`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES FOR ROLE betterai_app IN SCHEMA ${ident}
        GRANT ALL ON SEQUENCES TO betterai_admin;`);
    }

    // --- Ensure shadow DB exists and is owned by betterai_admin (simplest working perms) ---
    const { rows: [{ exists: shadowExists }] } = await adminClient.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      [shadowDbName]
    );

    if (!shadowExists) {
      console.log(`Creating shadow database "${shadowDbName}" owned by betterai_admin...`);
      await adminClient.query(`CREATE DATABASE "${shadowDbName}" OWNER betterai_admin`);
    } else {
      console.log(`✓ Shadow database "${shadowDbName}" already exists`);
    }

    // --- Initialize shadow DB extensions to mirror main/dev ---
    const shadowUrl = new URL(ownerDirectUrl);
    shadowUrl.pathname = `/${shadowDbName}`;
    const shadowClient = new Client({ connectionString: shadowUrl.toString() });
    try {
      await shadowClient.connect();
      await shadowClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      await shadowClient.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      console.log(`✓ Shadow database "${shadowDbName}" initialized`);
    } finally {
      await shadowClient.end();
    }

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
      u.pathname = `/${shadowDbName}`;
      return u.toString();
    })();

    // Print as simple key=value lines ready for Vercel / .env
    console.log("\n# === Copy these to your env store ===");
    console.log(`DATABASE_URL=${pooledAppUrl}`);                // pooled, app role (runtime)
    console.log(`DATABASE_URL_UNPOOLED=${directAppUrl}`);       // direct, app role (runtime without pooler)
    console.log(`SHADOW_DATABASE_URL=${shadowAdminUrl}`);       // direct, admin role, shadow DB

    console.log("\n# Done. Roles created/updated, grants applied, and shadow DB ensured.");
  } catch (err) {
    console.error("Provisioning failed:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    await adminClient.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});