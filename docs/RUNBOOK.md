## RUNBOOK: Database Operations (BetterAI)

This runbook documents safe database operations for BetterAI across development, staging/preview, and production environments.


Environments recap:
Hosting: single Vercel project. 
Environment Variables: Vercel is source of truth. Vercel CLI used to pull new values to dev.
Database: Single Neon database. Branches used for preview (on deman) and /dev (long running).
User Authentication: Privy Prod and Dev only. Not testing privy flows in Preview, b/c custom subdomains in Vercel cost $100/mo
Stripe: (future) Stripe Test keys for dev/preview, Live keys for prod








## Future state Env Variables Matrix

# BetterAI Environment Variables Matrix

This document describes how BetterAI manages secrets across **Development**, **Preview**, and **Production**.  
It assumes two roles per environment:
- **betterai_admin** → used for **migrations** (DDL), via **direct (unpooled)** endpoint.
- **betterai_app** → used for **application runtime** (CRUD), via **pooler** endpoint.

Secrets are managed with **Doppler** (source of truth) + **Neon** (Preview DB URLs) + **Vercel** (runtime).

---

## 🔑 Roles

- **betterai_admin**
  - Permissions: `CREATE`, `ALTER`, `DROP`, `ALL` on schemas
  - Usage: Prisma migrations, shadow DB
  - Connect via **direct endpoint**

- **betterai_app**
  - Permissions: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - Usage: App runtime (Next.js / serverless)
  - Connect via **pooler endpoint**

---

## 🌱 Development (local / Vercel Development)

| Var | Value (example) | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://betterai_app:<pwd>@<ep-dev-pooler-host>/<db>` | Pooler URL, **app role** |
| `DATABASE_URL_MIGRATIONS` | `postgres://betterai_admin:<pwd>@<ep-dev-direct-host>/<db>` | Direct URL, **admin role** |
| `SHADOW_DATABASE_URL` | `postgres://betterai_admin:<pwd>@<ep-dev-direct-host>/<shadow-db>` | Optional, only for Prisma shadow DB |
| Other secrets | (Privy dev app ID/secret, Stripe test keys, etc.) | All from Doppler |

**Usage:**
```bash
vercel env pull .env.local --environment=development
# or
doppler run -- npm run dev
