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
- **Alternative (simpler, lower isolation)**
  - 1 Vercel project + 1 Neon project with branches (`prod`, `dev`, optional `staging`). Map Production to `prod` branch, Preview/Development to `dev` branch. This shares quotas and blast radius, so the two-project model above is preferred for stability.

### Why `DATABASE_URL_UNPOOLED`?
- Neon’s pooler (PgBouncer) commonly runs in transaction pooling mode, which breaks long-lived or session-level transactions required by Prisma Migrate and some admin operations.
- Using the direct/unpooled URL ensures migrations can open session transactions, acquire locks, and complete atomically without pooler interference.
- Runtime app traffic should use pooled `DATABASE_URL` for efficient connection management; migrations/admin tasks should use `DATABASE_URL_UNPOOLED`.

### Commands and Scripts
- Development
  - Create/modify schema and generate a migration:
    ```bash
    pnpm prisma:migrate # or: npx prisma migrate dev --force --name <change>
    ```
  - Reset and seed local DB:
    ```bash
    pnpm db:bootstrap
    ```

- Production / Staging (apply committed migrations only)
  - Non-interactive, using the unpooled URL:
    ```bash
    pnpm prisma:migrate:deploy
    # Equivalent:
    DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma migrate deploy --force
    ```

- Safety guard already in place:
  - `pnpm db:reset` refuses to run when `NODE_ENV=production`.

### Migration Workflow
1. Develop locally: update `prisma/schema.prisma`, run `pnpm prisma:migrate` to create a migration.
2. Validate locally with `pnpm dev` and app flows. Seed sample data using `pnpm db:bootstrap` if needed.
3. Commit the migration files.
4. Deploy app. On production/staging, run `pnpm prisma:migrate:deploy` to apply committed migrations.
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
   - Alternative: one project `betterai` with branches `prod`, `dev`, optional `staging`.

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
   - Periodically test restores to validate your recovery process.

5. Branching strategy
   - Keep `prod` protected; restrict destructive operations.
   - For large schema changes, consider creating a transient branch to rehearse migrations with production-like data.

6. Observability
   - Monitor query performance and errors in Neon dashboard.
   - Keep Prisma logs off in prod (`PRISMA_LOG_QUERIES=false`) and enable as needed during incidents.

### Migration Path: Single project + single DB → Recommended topology
Follow this checklist to move from one Vercel project and one Neon database to isolated prod/dev environments.

1. Prepare
   - Ensure all Prisma migrations are committed and the app is deployable from `main`.
   - Take a Neon snapshot/backup of the current database.
   - Verify `.env.example` includes `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

2. Create Neon dev project
   - Create Neon project `betterai-dev` with branch `main`.
   - Create roles `betterai_app` and `betterai_admin`; generate pooled and direct connection strings.
   - Initialize schema by running migrations against dev: `DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm prisma:migrate deploy`.
   - Optionally seed: `pnpm db:bootstrap` (ensure it targets the dev project).

3. Split Vercel projects
   - Rename the existing Vercel project to `betterai-prod` (or create a fresh prod project and move domains).
   - Create a new Vercel project `betterai-dev` from the same repo.
   - In `betterai-prod`:
     - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (Production scope) to the Neon `betterai-prod` credentials.
     - Disable Preview deployments or leave Preview env vars blank.
   - In `betterai-dev`:
     - Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Development and Preview scopes to the Neon `betterai-dev` credentials.

4. Domains and routing
   - Attach production domains to `betterai-prod`.
   - Attach `dev.` subdomain (and Preview defaults) to `betterai-dev`.

5. CI/CD and protections
   - Enable PR Previews on `betterai-dev`. Optionally automate Neon preview branches per PR.
   - Protect `main` in GitHub; require CI checks before merging to production.

6. Cutover
   - Deploy `betterai-dev` and validate app behavior against the dev database.
   - Deploy `betterai-prod`; run `pnpm prisma:migrate:deploy` (uses unpooled URL) to apply committed migrations.
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
- Apply prod migrations: `pnpm prisma:migrate:deploy`
- Local dev migration: `pnpm prisma:migrate`
- Local reset + seed: `pnpm db:bootstrap`
- Guarded destructive op: `pnpm db:reset` (blocked when `NODE_ENV=production`)


