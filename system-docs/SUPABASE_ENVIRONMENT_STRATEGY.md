# Supabase Environment Management Strategy for BetterAI

## Overview

This document outlines the recommended approach for managing database environments, migrations, and Prisma integration for BetterAI as a solo-developer project.

## Strategy: Pragmatic Two-Project Setup

### Why Not Three Separate Projects?

While Supabase recommends separate projects for local/staging/production, for a solo developer:
- **Cost**: Each Supabase project on free tier has limits; paid tier costs add up
- **Complexity**: Managing 3 databases increases operational overhead
- **Your use case**: Preview deployments should mirror production data (per your RUNBOOK)

### Recommended Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT                              │
│  Local Supabase (Docker) OR Shared Dev Project              │
│  - Fast iteration                                            │
│  - Safe to break                                             │
│  - Frequent schema changes                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Prisma Migrations
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                               │
│  Supabase Production Project                                │
│  - Real user data                                            │
│  - Stable schema                                             │
│  - Preview deployments use production DB (read-only safe)   │
└─────────────────────────────────────────────────────────────┘
```

## Option 1: Two Supabase Projects (Recommended)

### Setup

1. **Production Supabase Project** (Current)
   - Your existing migrated database
   - Used by: Production & Preview deployments
   - Connection: Session Pooler (port 6543)

2. **Development Supabase Project** (New)
   - Separate Supabase project for development
   - Free tier is fine
   - Safe to experiment and break
   - Connection: Session Pooler (port 6543)

### Environment Variables

```bash
# Development (.env.local)
DATABASE_URL="postgresql://postgres.[DEV-PROJECT-REF]:[DEV-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Production (Vercel Production)
DATABASE_URL="postgresql://postgres.[PROD-PROJECT-REF]:[PROD-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Preview (Vercel Preview)
DATABASE_URL="postgresql://postgres.[PROD-PROJECT-REF]:[PROD-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
# NOTE: Preview uses production database (safe for read-heavy preview deployments)
```

### Migration Workflow

```bash
# 1. Local Development
# Work on dev database, create migration
pnpm prisma migrate dev --name "add_new_feature"

# 2. Test locally
pnpm run dev
# Verify feature works

# 3. Commit migration files
git add prisma/migrations/
git commit -m "feat: add new feature"

# 4. Push to main
git push origin main

# 5. GitHub Actions automatically:
# - Runs migration on production database
# - Triggers Vercel redeployment
```

### Pros
✅ Complete isolation between dev and prod
✅ Safe to experiment in development
✅ Production data stays pristine
✅ Free tier works for dev project
✅ Preview deployments can safely use prod DB (read-mostly operations)

### Cons
❌ Need to manage two Supabase projects
❌ Production data not available locally (need to seed dev)
❌ Must remember to apply migrations to both environments

---

## Option 2: Local Supabase + Production Project (Most Aligned with Supabase Docs)

### Setup

1. **Local Supabase** (via Docker)
   - Run `supabase init` in your project
   - Local PostgreSQL via Docker Compose
   - Completely isolated, can reset anytime
   - Free and fast

2. **Production Supabase Project** (Current)
   - Your existing production database
   - Used by: Production & Preview

### Installation

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize Supabase in project
supabase init

# Start local Supabase
supabase start
```

### Environment Variables

```bash
# Development (.env.local) - Local Supabase
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Production (Vercel Production)
DATABASE_URL="postgresql://postgres.[PROD-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Preview (Vercel Preview)
DATABASE_URL="postgresql://postgres.[PROD-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

### Migration Workflow (Prisma + Supabase CLI)

```bash
# 1. Start local Supabase
supabase start

# 2. Create Prisma migration
pnpm prisma migrate dev --name "add_new_feature"

# 3. Generate Supabase migration from Prisma schema
supabase db diff -f add_new_feature --use-migra

# 4. Test migration locally
supabase db reset  # Applies all migrations fresh

# 5. Commit both Prisma and Supabase migrations
git add prisma/migrations/ supabase/migrations/
git commit -m "feat: add new feature"

# 6. Deploy via GitHub Actions
# Uses prisma migrate deploy (or supabase db push)
```

### Pros
✅ Free local development
✅ Fully aligned with Supabase best practices
✅ Can reset local DB anytime without consequences
✅ Docker-based, consistent across machines
✅ Can test migrations in complete isolation

### Cons
❌ Requires Docker running locally
❌ Need to maintain both Prisma and Supabase migrations
❌ More complex setup
❌ Local DB needs seeding for realistic testing

---

## Option 3: Single Supabase Project (Current - Not Recommended)

### Current Setup
- One Supabase project shared across all environments
- Uses namespacing or careful handling to avoid conflicts

### Why Not Recommended
❌ Risk of breaking production during development
❌ Can't easily reset/experiment
❌ Supabase documentation explicitly warns against this
❌ Schema conflicts between environments

---

## Recommended Migration Path: Choose Option 1 or 2

### For Solo Developer Speed → **Option 1** (Two Supabase Projects)
- Simpler to manage
- No Docker required
- Free tier works fine for dev
- Quick to set up

### For Long-term Best Practices → **Option 2** (Local Supabase)
- More aligned with Supabase ecosystem
- Free local development
- Better isolation
- Industry standard approach

---

## Migration Management: Prisma-First Approach

### Why Prisma for Migrations?

You're already using Prisma and have 29 existing migrations. Stick with Prisma:

✅ **Keep using Prisma migrate** for schema management
✅ Your existing workflow already works
✅ Type safety with generated Prisma client
✅ Simpler than maintaining two migration systems

### When to Use Supabase Migrations

Only if you need Supabase-specific features:
- Row Level Security (RLS) policies
- Supabase Auth triggers
- PostgREST API customizations
- Realtime subscriptions configuration

For BetterAI's use case (standard CRUD with tRPC), **Prisma is sufficient**.

---

## Implementation Plan

### Phase 1: Set Up Development Environment (Choose One)

**Option 1A: Create Dev Supabase Project**
```bash
# 1. Create new Supabase project at supabase.com
# Name it: betterai-dev

# 2. Get connection string
# Dashboard → Settings → Database → Connection string → Session mode

# 3. Update local .env.local
DATABASE_URL="postgresql://postgres.[DEV-REF]:[DEV-PWD]@aws-0-region.pooler.supabase.com:6543/postgres"

# 4. Run migrations on dev database
pnpm prisma migrate deploy

# 5. Seed dev database (optional)
pnpm prisma db seed  # If you have seed script
```

**Option 1B: Use Local Supabase**
```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Initialize in project
supabase init

# 3. Start local instance
supabase start
# Note the Database URL (usually postgresql://postgres:postgres@localhost:54322/postgres)

# 4. Update .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# 5. Run Prisma migrations
pnpm prisma migrate deploy
```

### Phase 2: Update Vercel Environment Variables

```bash
# Development environment - point to dev database
vercel env add DATABASE_URL development
# Paste dev database URL

# Production environment - point to prod database (already done)
# Preview environment - point to prod database (read-safe)
vercel env add DATABASE_URL preview
# Paste production database URL (same as prod)
```

### Phase 3: Update Documentation

Update [RUNBOOK.md](./RUNBOOK.md) to reflect:
- Development uses separate database (dev project or local)
- Production uses production Supabase project
- Preview uses production database (safe for read-heavy previews)

### Phase 4: Test Migration Workflow

```bash
# 1. Make a schema change locally
# Edit prisma/schema.prisma

# 2. Create migration
pnpm prisma migrate dev --name "test_dev_setup"

# 3. Verify in dev database
pnpm prisma studio

# 4. Commit and push
git add prisma/
git commit -m "test: verify dev migration workflow"
git push origin main

# 5. GitHub Actions will apply to production
# Monitor deployment
```

---

## Connection Pooling Best Practices

### For BetterAI (Vercel Serverless)

**Always use Session Pooler (port 6543):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Why Session Mode?

- **Serverless-friendly**: Each Vercel function can open/close connections
- **Prisma compatible**: Works with Prisma's connection management
- **Migration-safe**: Supports DDL operations (ALTER, CREATE, DROP)
- **IPv4 compatible**: Works on all networks

### Connection Limits

Free tier Supabase:
- Direct connections: ~60 (don't use these)
- Pooled connections: ~200 (use Session Pooler)

Vercel serverless functions can spike to many concurrent instances, so pooling is essential.

---

## GitHub Actions Migration Strategy

Your current [database-migration.yml](../.github/workflows/database-migration.yml) already works well.

### Enhancements to Consider

```yaml
# .github/workflows/database-migration.yml
# Add environment-specific migration testing

jobs:
  test-migration-on-dev:
    name: Test Migration on Dev Database
    runs-on: ubuntu-latest
    if: github.ref != 'refs/heads/main'
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL_DEV }}
    steps:
      # ... apply migration to dev database first
      # ... run integration tests
      # ... only merge to main if tests pass

  deploy-migration-to-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: test-migration-on-dev
    if: github.ref == 'refs/heads/main'
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      # ... existing production migration steps
```

---

## Schema Sync Strategy

### Development → Production

```bash
# 1. Work in dev environment
# Make schema changes, create migrations

# 2. Test thoroughly in dev
pnpm run dev
pnpm run test

# 3. Commit migrations
git add prisma/migrations/
git commit -m "feat: add new feature"

# 4. Push to main
# GitHub Actions applies to production automatically
```

### Production → Development (Occasional Sync)

If you need to pull production schema to dev:

```bash
# 1. Get production schema
pnpm prisma db pull --url="$PRODUCTION_DATABASE_URL"

# 2. Review changes
git diff prisma/schema.prisma

# 3. Generate migration if needed
pnpm prisma migrate dev --name "sync_from_prod"
```

---

## Rollback Strategy (Enhanced)

See [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) for full details.

Quick rollback with separate environments:

```bash
# If migration breaks production:

# Option A: Forward migration (preferred)
# 1. Fix in dev environment
pnpm prisma migrate dev --name "fix_broken_feature"
# 2. Test in dev
# 3. Deploy to prod via GitHub Actions

# Option B: Point-in-time recovery (emergency)
# 1. Use Supabase dashboard → Database → Backups
# 2. Restore to point before bad migration
# 3. Redeploy previous git commit
```

---

## Data Seeding Strategy

### Development Database

Create seed script for realistic testing:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Seed test users
  await prisma.user.createMany({
    data: [
      { id: 'test-user-1', email: 'test@example.com', username: 'testuser' },
      // ... more test data
    ]
  })

  // Seed test markets (use subset of real data)
  // ...
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```json
// package.json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Production Database

**Never seed production.** Use migrations only.

---

## Cost Considerations

### Supabase Free Tier Limits (per project)

- Database size: 500 MB
- Egress: 2 GB
- Storage: 1 GB
- Monthly Active Users: Unlimited

### Recommendation

- **Production**: Keep on Free tier initially, upgrade if you hit limits
- **Development**: Free tier is more than sufficient
- **Cost**: $0/month for both projects on free tier

If you outgrow free tier:
- Production: ~$25/month for Pro plan
- Development: Stay on free tier (reset data periodically)

---

## Summary: Recommended Setup

### ✅ Choose This Setup

1. **Two Supabase Projects**
   - Development: New Supabase project (free tier)
   - Production: Current Supabase project

2. **Migration Strategy**
   - Use Prisma migrate for all schema changes
   - Test in dev first
   - GitHub Actions deploys to production

3. **Shadow Database** (see [PRISMA_SHADOW_DATABASE_STRATEGY.md](./PRISMA_SHADOW_DATABASE_STRATEGY.md))
   - With separate dev project: Prisma auto-creates/deletes shadow DB (no configuration needed!)
   - No manual shadow database setup required
   - No separate schema needed
   - Just works automatically

4. **Environment Variables**
   - Development → Dev Supabase
   - Production → Prod Supabase
   - Preview → Prod Supabase (read-safe)

5. **Connection Pooling**
   - Always use Session Pooler (port 6543)
   - Never use direct connections with Vercel

### Next Steps

1. Create development Supabase project
2. Update `.env.local` with dev database URL
3. Run migrations on dev database
4. Test full development workflow
5. Update documentation
6. Celebrate simpler, safer environment management! 🎉

---

## References

- [Supabase Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Prisma Deploy Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production)
- [Prisma Shadow Database Strategy](./PRISMA_SHADOW_DATABASE_STRATEGY.md)
- [Your RUNBOOK.md](./RUNBOOK.md)
- [Your DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)
