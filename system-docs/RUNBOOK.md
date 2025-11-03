# RUNBOOK: Database Operations (BetterAI)

This runbook documents safe database operations for BetterAI across development, staging/preview, and production environments.


## Environments recap
Hosting: single Vercel project.
Environment Variables: Vercel is source of truth. Vercel CLI used to pull new values to dev.
Postgres Database: Single Supabase database (migrated from Neon). Session Pooler used for all connections.
Redis Database: single Upstash instance for all environments. Namespaces used to separate environments.
User Authentication: Privy Prod and Dev only. Not testing privy flows in Preview, b/c custom subdomains in Vercel cost $100/mo
Stripe: (future) Stripe Test keys for dev/preview, Live keys for prod


Preview rules of thumb: Database: mimic Prod. APIs/3rd-party services: mimic Dev (sandbox/test).


## Weekly Maintenance:
git clean-branches


## Monthly Maintenance



## Simplified Env Variables (Supabase Migration)

### BetterAI Environment Variables Matrix

This document describes how BetterAI manages secrets across **Development**, **Preview**, and **Production**.

With Supabase Session Pooler, we use a simplified single-URL approach:
- One `DATABASE_URL` for both runtime and migrations
- No separate roles needed (uses postgres superuser)
- Session Pooler (port 6543) handles both use cases

Secrets are managed with **Vercel** (runtime).

---

## 🔑 Database Connection

- **postgres (Supabase superuser)**
  - Permissions: Full access (CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE)
  - Usage: Both app runtime and migrations
  - Connect via **Session Pooler** (port 6543)

---

## 🌱 Development (local / Vercel Development)

| Var | Value (example) | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` | Supabase Session Pooler - for both runtime and migrations |
| Other secrets | (Privy dev app ID/secret, etc.) | All from Vercel |

**Usage:**
```bash
vercel env pull .env.local --environment=development
# then
pnpm run dev
