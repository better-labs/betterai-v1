## RUNBOOK: Database Operations (BetterAI)

This runbook documents safe database operations for BetterAI across development, staging/preview, and production environments.

### Environments and URLs
- **Development (local)**
  - Use a dedicated dev database/branch.
  - `.env` should define `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct/non-pooled).
  - Prefer enabling verbose logs locally: `PRISMA_LOG_QUERIES=true`.

- **Production (Vercel)**
  - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel Project Settings → Environment Variables (Production scope).
  - Keep `PRISMA_LOG_QUERIES=false`.

- **Optional: Staging/Preview**
  - Either a separate Neon project or a Neon branch per environment.
  - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel Preview scope.

Note: This project standardizes on `.env` (not `.env.local`). Update `.env.example` as the source of truth and keep secrets out of VCS.

### Recommended Environment Topology
- **Vercel projects (recommended: 2)**
  - `betterai-prod`: Production only. Disable Preview deployments or leave Preview unset.
  - `betterai-dev`: Handles Development and Preview (PR) deployments.
- **Neon projects (recommended: 2)**
  - `betterai-prod` project → branch `main` for production data only.
  - `betterai-dev` project → branch `main` for dev; optional ephemeral branches `pr-<n>` for previews.
- **Environment variables per project**
  - Both projects define `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) with their respective Neon project credentials.
  - In `betterai-prod`, set variables only in the Production scope.
  - In `betterai-dev`, set variables in both Development and Preview scopes.



### Migration Workflow
1. Develop locally: update `prisma/schema.prisma`, run `pnpm prisma:migrate` to create a migration.
2. Validate locally with `pnpm dev` and app flows. Seed sample data using `pnpm db:bootstrap` if needed.
3. Commit the migration files.
4. Deploy app. On production/staging, run `pnpm migrate:deploy:base` (or the env wrapper) to apply committed migrations.
5. Never run `migrate dev` or `db:reset` against production.

### Rollbacks
- Prisma does not provide automatic down-migrations for production. If a migration causes issues:
  - Prefer database restore from Neon backups/point-in-time restore (PITR) to a safe timestamp.
  - If schema change must be reversed forward-only, create a new migration that reverts the change (additive migrations preferred).

### Neon Setup
Use these steps with your Neon account. Adjust names to your preference.

1. Project structure (recommended) 
   - Create two Neon projects for isolation:
     - `betterai-prod` → branch `main` (protected)
     - `betterai-dev` → branch `main` (default), plus optional preview branches `pr-<n>`
   

2. Roles and users
   - Create a primary app role: `betterai_app` with least-privilege for runtime.
   - Create an admin role: `betterai_admin` for migrations and maintenance.
   - Generate separate credentials for each role and each environment.
   - Map URLs:
     - `DATABASE_URL` → pooler endpoint + `betterai_app` credentials
     - `DATABASE_URL_UNPOOLED` → direct endpoint + `betterai_admin` credentials

3. Pooler vs direct endpoints
   - Obtain both the pooler host and the direct host from Neon connection details.
   - Ensure `sslmode=require` for both.

4. Backups and retention
   - Enable daily automated backups and (if available on your plan) point-in-time restore.
   - Set retention to meet your data policy (e.g., 7–30 days minimum).
   - TODO: Periodically test restores to validate your recovery process.

5. Branching strategy
   - Keep `prod` protected; restrict destructive operations.
   - For large schema changes, consider creating a transient branch to rehearse migrations with production-like data.

6. Observability
   - Monitor query performance and errors in Neon dashboard.
   - Keep Prisma logs off in prod (`PRISMA_LOG_QUERIES=false`) and enable as needed during incidents.

### Migration Path: Single project + single DB → Recommended topology
Follow this checklist to move from one Vercel project and one Neon database to isolated prod/dev environments.

1. Prepare (done)
   - Ensure all Prisma migrations are committed and the app is deployable from `main`.
   - Take a Neon snapshot/backup of the current database.
   - Verify `.env.example` includes `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

2. Create Neon dev project (done)
   - Create Neon project `betterai-dev` with branch `main`.
   - Create roles `betterai_app` and `betterai_admin`; generate pooled and direct connection strings.
   - Initialize schema by running migrations against dev
   - Optionally seed: `pnpm db:bootstrap` (ensure it targets the dev project).

3. Split Vercel projects (done)
   - Rename the existing Vercel project to `betterai-prod` (or create a fresh prod project and move domains).
   - Create a new Vercel project `betterai-dev` from the same repo.
   - In `betterai-prod`:
     - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (Production scope) to the Neon `betterai-prod` credentials.
     - Disable Preview deployments or leave Preview env vars blank.
   - In `betterai-dev`:
     - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Development and Preview scopes to the Neon `betterai-dev` credentials.

4. Domains and routing (done)
   - Attach production domains to `betterai-prod`.
   - Attach `dev.` subdomain (and Preview defaults) to `betterai-dev`.

5. CI/CD and protections
   - Enable PR Previews on `betterai-dev`. Optionally automate Neon preview branches per PR.
   - Protect `main` in GitHub; require CI checks before merging to production.

6. Cutover
   - Deploy `betterai-dev` and validate app behavior against the dev database.
   - Deploy `betterai-prod`; run `pnpm migrate:deploy:base` (uses unpooled URL) to apply committed migrations.
   - Verify background jobs and cron secrets are scoped correctly.

7. Decommission old wiring
   - Remove any legacy env prefixes (see Vercel–Neon integration note below).
   - Confirm the old shared database is not referenced by any project.

### Vercel–Neon integration variable names
- Do not set an Environment Variables Prefix (leave it blank). The app expects exact names:
  - `DATABASE_URL` (pooled)
  - `DATABASE_URL_UNPOOLED` (direct)
- If you previously set a prefix (e.g., `DATABASE_`), the integration will create variables like `DATABASE_DATABASE_URL` which the app will not read. Fix by either:
  - Removing/clearing the prefix and reconnecting the integration, or
  - Manually creating `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel with the correct values from Neon.

### Operational Practices
- Separate envs: never point local/dev to production database.
- Use pooled URL for app servers, unpooled for migrations.
- Gate background jobs to production via environment and `CRON_SECRET`.
- Prefer additive, backward-compatible migrations; schedule zero-downtime changes.
- Regularly export or snapshot critical tables in addition to automated backups.

### Quick Reference
- Apply prod migrations: `pnpm migrate:deploy:base`
- Local dev migration: `pnpm prisma:migrate`
- Local reset + seed: `pnpm db:bootstrap`
- Guarded destructive op: `pnpm db:reset` (blocked when `NODE_ENV=production`)



### Neon roles quick start (betterai_app, betterai_admin)
Follow these steps per Neon project (prod and dev) on the target branch (e.g., `main`).

**Important:** Connect as the database owner (`neondb_owner`) to run these permission commands, as only the table owner can grant permissions to other users.

1)(done) Create roles and grants in Neon (run in SQL editor or psql as `neondb_owner`)
```sql
-- Create login roles with strong, URL-safe passwords
-- Note: If these roles already exist, skip the CREATE ROLE commands
CREATE ROLE betterai_app LOGIN PASSWORD '$APP_PASSWORD';
CREATE ROLE betterai_admin LOGIN PASSWORD '$ADMIN_PASSWORD';

-- Allow connection to the database
GRANT CONNECT ON DATABASE neondb TO betterai_app, betterai_admin;

-- Grant schema access to both roles
GRANT USAGE ON SCHEMA public TO betterai_app, betterai_admin;
GRANT CREATE ON SCHEMA public TO betterai_admin;

-- Grant table/sequence privileges on ALL existing objects to betterai_app
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO betterai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO betterai_app;

-- Grant admin full access to existing objects (for migrations and maintenance)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO betterai_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO betterai_admin;

-- Set default privileges for future objects created by neondb_owner
-- This ensures new tables automatically grant permissions to betterai_app
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;

-- Also grant default privileges to admin for future maintenance
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO betterai_admin;
```

- Verify ownership and current grants (run as `neondb_owner`)
  ```sql
  -- Check schema owner (should be neondb_owner)
  SELECT n.nspname AS schema, pg_get_userbyid(n.nspowner) AS owner
  FROM pg_namespace n
  WHERE n.nspname = 'public';

  -- Check table owners (should be neondb_owner)
  SELECT schemaname, tablename, tableowner
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;

  -- Verify permissions for betterai_app on all tables
  SELECT table_name, string_agg(privilege_type, ', ') as privileges 
  FROM information_schema.table_privileges 
  WHERE grantee = 'betterai_app' AND table_schema = 'public'
  GROUP BY table_name 
  ORDER BY table_name;

  -- Test actual database access with betterai_app (run as betterai_app user)
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM predictions;
  ```

**Troubleshooting Permission Issues:**

If `betterai_app` gets "permission denied" errors, run these commands as `neondb_owner`:

```sql
-- Re-grant all current table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO betterai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO betterai_app;
GRANT USAGE ON SCHEMA public TO betterai_app;

-- Re-set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO betterai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO betterai_app;
```

2)(done) Build the two connection strings 
```text
DATABASE_URL=postgres://betterai_app:APP_PASSWORD@POOLER_HOST:5432/YOUR_DB_NAME?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://betterai_admin:ADMIN_PASSWORD@DIRECT_HOST:5432/YOUR_DB_NAME?sslmode=require
```

3)(done) Set env vars in Vercel 
- betterai-prod (Production scope): set `DATABASE_URL` (pooled, `betterai_app`) and `DATABASE_URL_UNPOOLED` (direct, `betterai_admin`).
- betterai-dev (Development and Preview scopes): set both vars to the dev Neon credentials.
- If using the Vercel–Neon integration, leave the prefix blank so names match exactly.

4) (done) Run migrations using the unpooled URL
```bash
pnpm migrate:deploy:base
# or explicitly
DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma migrate deploy --force
```

**Note on Migrations:** Prisma migrations will create new tables owned by `neondb_owner` (since that's the database owner), not `betterai_admin`. This is expected behavior in Neon. The default privileges we set above ensure that new tables automatically grant permissions to both `betterai_app` and `betterai_admin`.

**Current Production Setup (as of latest permission fix):**
- Tables owned by: `neondb_owner` (Neon default owner)
- App runtime user: `betterai_app` (pooled connection via `DATABASE_URL`)
- Migration user: `betterai_admin` (direct connection via `DATABASE_URL_UNPOOLED`)
- Both users have full `SELECT, INSERT, UPDATE, DELETE` permissions on all tables
- Default privileges ensure future tables automatically grant permissions to both users

5) (done) Verify connectivity and permissions
- App runtime connects via pooled `DATABASE_URL` (role `betterai_app`).
- Migrations succeed via direct `DATABASE_URL_UNPOOLED` (role `betterai_admin`).
- New tables created by migrations automatically have proper permissions due to default privileges.
- Repeat steps for each Neon project (prod and dev).
