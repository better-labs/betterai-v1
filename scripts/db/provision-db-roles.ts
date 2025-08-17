/**
 * Provision/rotate BetterAI DB roles and emit app URLs.
 *
 * Usage:
 *   ts-node provision-db-roles.ts "postgres://neondb_owner:...@ep-xxxxx-pooler.us-east-1.aws.neon.tech/betterai?sslmode=require"
 *
 * What it does:
 *   - Validates the input URL includes 'neondb_owner' and '-pooler'
 *   - Connects using the same creds but to the **direct (non-pooler)** host
 *   - Creates or updates:
 *       - betterai_admin  (DDL / migrations)
 *       - betterai_app    (CRUD / runtime)
 *   - Grants least-privilege on all existing schemas (excl. pg_catalog, information_schema, pg_toast, temp schemas)
 *   - Sets default privileges so **future tables/sequences** inherit correct grants
 *   - Prints DATABASE_URL (pooled, app role) and DATABASE_URL_UNPOOLED (direct, app role)
 */

import { Client } from "pg";
import crypto from "crypto";

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function genPassword(bytes = 48): string {
  // URL-safe base64 (no '+' or '/'); keep it simple for copy/paste & .env
  // Ensure minimum length for security
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

  // Must be the owner user (getting-started default)
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

  // Build a direct URL for admin connection (same owner creds)
  const ownerDirectUrl = buildUrl(url, {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: directHost,
  });

  // Connect as owner on the **direct** endpoint so DDL works reliably
  const adminClient = new Client({ connectionString: ownerDirectUrl });
  
  try {
    await adminClient.connect();
    console.log("✓ Connected to database as neondb_owner");
  } catch (err) {
    fatal(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Generate new passwords
  const appPwd = genPassword();
  const adminPwd = genPassword();

  // Helpers
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName) fatal("Database name missing in URL path.");
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
    fatal("Database name contains invalid characters. Use only letters, numbers, and underscores.");
  }

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

    // Ensure both roles can CONNECT (proper identifier escaping)
    await adminClient.query(
      `GRANT CONNECT ON DATABASE "${dbName.replace(/"/g, '""')}" TO betterai_admin, betterai_app;`
    );

    // Discover non-system schemas (including "public")
    const { rows: schemaRows } = await adminClient.query<{
      nspname: string;
    }>(`
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

    // Build and apply grants per schema
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
    }

    // Construct output URLs for **app role** as requested
    const pooledAppUrl = buildUrl(url, {
      username: "betterai_app",
      password: appPwd,
      host: pooledHost, // keep -pooler
    });

    const directAppUrl = buildUrl(url, {
      username: "betterai_admin",
      password: adminPwd,
      host: directHost, // remove -pooler
    });

    // Print as simple key=value lines ready for Vercel / .env
    console.log("\n# === Copy these to your env store ===");
    console.log(`DATABASE_URL=${pooledAppUrl}`);
    console.log(`DATABASE_URL_UNPOOLED=${directAppUrl}`);

    // // (Optional) also print a migrations URL for convenience
    // const directAdminUrl = buildUrl(url, {
    //   username: "betterai_admin",
    //   password: adminPwd,
    //   host: directHost,
    // });
    // console.log("\n# (Optional) For Prisma migrations use admin+direct:");
    // console.log(`# DATABASE_URL_MIGRATIONS=${directAdminUrl}`);

    console.log("\n# Done. Roles created/updated and privileges applied.");
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
