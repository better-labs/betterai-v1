# Database Setup & Migration Guide for BetterAI

**Complete guide for migrating from Neon to Supabase and setting up proper dev/prod environments.**

---

## 🎯 Recommended Setup: Two-Database Strategy

### Why Two Databases?

- **Development**: Safe to experiment, break, and iterate
- **Production**: Protected real user data
- **Shadow DB**: Prisma handles automatically (no config needed!)
- **Simple**: One `DATABASE_URL` per environment, nothing else

---

## 📋 Quick Start Checklist

### Prerequisites (One-Time Setup)

- [ ] Install PostgreSQL tools: `brew install postgresql`
- [ ] Have Vercel CLI: `npm i -g vercel`
- [ ] Current Neon database is backed up

### Part 1: Create Development Database (15 min)

- [ ] **Create dev Supabase project** at [supabase.com](https://supabase.com)
  - Name: `betterai-dev`
  - Region: Same as production (e.g., `us-east-1`)
  - Password: Generate strong password, save it

- [ ] **Get dev connection string**
  - Dashboard → Settings → Database → Connection string
  - Select "Session mode" (port 6543)
  - Copy: `postgresql://postgres.[DEV-REF]:[DEV-PWD]@aws-0-[region].pooler.supabase.com:6543/postgres`

- [ ] **Update local `.env.local`**
  ```bash
  cp .env.local .env.local.backup
  # Edit .env.local and set:
  DATABASE_URL="postgresql://postgres.[DEV-REF]:[DEV-PWD]@..."
  ```

- [ ] **Apply existing migrations to dev**
  ```bash
  pnpm prisma migrate deploy
  ```

- [ ] **Test shadow DB works** (Prisma auto-creates/deletes it)
  ```bash
  pnpm prisma migrate dev --name "test_setup"
  # ✅ Should complete without errors
  ```

### Part 2: Migrate Production to Supabase (30 min)

- [ ] **Create production Supabase project** at [supabase.com](https://supabase.com)
  - Name: `betterai-prod`
  - Region: Choose closest to users
  - Password: Generate strong password, save it

- [ ] **Get prod connection string**
  - Dashboard → Settings → Database → Connection string
  - Select "Session mode" (port 6543)
  - Copy: `postgresql://postgres.[PROD-REF]:[PROD-PWD]@aws-0-[region].pooler.supabase.com:6543/postgres`

- [ ] **Dump data from Neon**
  ```bash
  # Get current Neon URL
  cat .env.local.backup | grep DATABASE_URL

  # Dump to file
  pg_dump "YOUR_NEON_URL" \
    --no-owner --no-acl --clean --if-exists \
    --format=custom \
    --file=neon-backup-$(date +%Y%m%d).dump
  ```

- [ ] **Restore to Supabase production**
  ```bash
  pg_restore \
    --no-owner --no-acl --clean --if-exists \
    -d "postgresql://postgres.[PROD-REF]:[PROD-PWD]@..." \
    neon-backup-*.dump
  ```

- [ ] **Verify data integrity**
  ```bash
  # Check row counts
  psql "YOUR_SUPABASE_PROD_URL" -c "SELECT COUNT(*) FROM users;"
  psql "YOUR_SUPABASE_PROD_URL" -c "SELECT COUNT(*) FROM markets;"
  psql "YOUR_SUPABASE_PROD_URL" -c "SELECT COUNT(*) FROM predictions;"
  ```

### Part 3: Update Vercel Environment Variables (10 min)

- [ ] **Development environment**
  ```bash
  vercel env add DATABASE_URL development
  # Paste: postgresql://postgres.[DEV-REF]:[DEV-PWD]@...

  # Remove old variables
  vercel env rm DATABASE_URL_UNPOOLED development
  vercel env rm SHADOW_DATABASE_URL development
  ```

- [ ] **Production environment**
  ```bash
  vercel env add DATABASE_URL production
  # Paste: postgresql://postgres.[PROD-REF]:[PROD-PWD]@...

  # Remove old variables
  vercel env rm DATABASE_URL_UNPOOLED production
  vercel env rm SHADOW_DATABASE_URL production
  ```

- [ ] **Preview environment** (uses production DB, read-safe)
  ```bash
  vercel env add DATABASE_URL preview
  # Paste: postgresql://postgres.[PROD-REF]:[PROD-PWD]@... (same as prod)

  # Remove old variables
  vercel env rm DATABASE_URL_UNPOOLED preview
  vercel env rm SHADOW_DATABASE_URL preview
  ```

### Part 4: Deploy & Verify (10 min)

- [ ] **Test local development**
  ```bash
  # Switch back to dev database locally
  # Edit .env.local: DATABASE_URL="postgresql://postgres.[DEV-REF]..."

  pnpm run dev
  # Verify app works
  ```

- [ ] **Deploy to production**
  ```bash
  git add .
  git commit -m "chore: migrate to Supabase with dev/prod split"
  git push origin main
  ```

- [ ] **Monitor deployment**
  - Check Vercel logs for successful deployment
  - Test production site functionality
  - Check Supabase dashboard for active connections

- [ ] **Update documentation**
  - Update [RUNBOOK.md](./RUNBOOK.md) with new database URLs
  - Document which Supabase project is dev vs prod

### Part 5: Cleanup (Optional, after 1 week)

- [ ] Delete Neon backup file: `rm neon-backup-*.dump`
- [ ] Delete Neon project (once confirmed Supabase is stable)
- [ ] Delete `.env.local.backup`

---

## 🏗️ Architecture Overview

### Current Setup (After Migration)

```
┌─────────────────────────────────────────────┐
│           DEVELOPMENT                       │
│  Supabase Dev Project (betterai-dev)       │
│  - Local .env.local                         │
│  - Safe to experiment                       │
│  - Prisma auto-creates shadow DB            │
│  - Free tier                                │
└─────────────────────────────────────────────┘
                    ↓
            Create migrations
            Test locally
                    ↓
            git push origin main
                    ↓
┌─────────────────────────────────────────────┐
│           PRODUCTION                        │
│  Supabase Prod Project (betterai-prod)     │
│  - GitHub Actions applies migrations        │
│  - Vercel Preview uses same DB (read-safe)  │
│  - Real user data                           │
└─────────────────────────────────────────────┘
```

### Environment Variable Mapping

| Environment | DATABASE_URL | Used By | Notes |
|------------|-------------|---------|-------|
| **Local Development** | Dev Supabase | Your laptop | Edit schema, test features |
| **Vercel Development** | Dev Supabase | Vercel dev deployments | Same as local |
| **Vercel Preview** | Prod Supabase | PR preview deployments | Read-heavy, safe to share prod data |
| **Vercel Production** | Prod Supabase | Live site | Real users |

---

## 🔄 Daily Development Workflow

### Making Schema Changes

```bash
# 1. Edit Prisma schema locally
vim prisma/schema.prisma

# 2. Create migration (Prisma auto-handles shadow DB)
pnpm prisma migrate dev --name "add_new_feature"
# ✅ Shadow DB created, migration tested, shadow DB deleted

# 3. Test locally
pnpm run dev

# 4. Commit migration files
git add prisma/migrations/
git commit -m "feat: add new feature"

# 5. Push to deploy
git push origin main

# 6. GitHub Actions automatically:
#    - Validates migration
#    - Runs: prisma migrate deploy (no shadow DB needed in prod)
#    - Triggers Vercel redeployment
```

### Key Commands

```bash
# Check migration status
pnpm run db:migrate:status:dev

# Validate schema
pnpm run db:validate

# Generate Prisma client
pnpm run db:prisma:generate

# Open database GUI
pnpm prisma studio

# Seed dev database (if you create seed script)
pnpm run db:seed
```

---

## 🛡️ Shadow Database: How It Works

### What Is It?

A **temporary** database Prisma creates during `prisma migrate dev` to:
- Detect schema drift
- Validate migrations before applying
- Warn about data loss

### When Is It Used?

```
Command                      Shadow DB Required?
────────────────────────────────────────────────
prisma migrate dev           ✅ YES (dev only)
prisma migrate deploy        ❌ NO  (production)
prisma db push               ❌ NO  (prototyping)
```

### How Our Setup Handles It

**With separate dev Supabase project:**
- ✅ Prisma auto-creates shadow DB in dev project
- ✅ Names it `postgres_prisma_shadow_XXXX`
- ✅ Uses it to validate migration
- ✅ Deletes it automatically
- ✅ **Zero configuration needed!**

**No manual setup, no separate schemas, no extra config.**

---

## 📊 Connection Pooling

### Always Use Session Pooler (Port 6543)

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Why Session Mode?

- ✅ **Serverless-friendly**: Vercel functions can open/close connections
- ✅ **Prisma compatible**: Works with Prisma's connection management
- ✅ **Migration-safe**: Supports DDL operations (ALTER, CREATE, DROP)
- ✅ **IPv4 compatible**: Works on all networks

### Connection Limits

| Supabase Tier | Direct | Pooled (Session) |
|--------------|--------|------------------|
| Free | ~60 | ~200 |
| Pro | ~200 | ~500 |

**Never use direct connections with Vercel** - serverless functions will exhaust connections.

---

## 🔥 Troubleshooting

### Shadow Database Errors

**Error**: `Error: Prisma cannot create shadow database`

**Solution**:
1. Verify you're using dev Supabase project in `.env.local`
2. Check connection string has correct password
3. Test connection: `psql "$DATABASE_URL" -c "SELECT version();"`

### Migration Fails in Production

**Error**: Migration fails in GitHub Actions

**Solution**:
1. Check GitHub Actions logs for specific error
2. Verify `DATABASE_URL` secret is set in GitHub
3. Test migration locally first: `pnpm run db:migrate:deploy:ci`

### IPv4/IPv6 Connection Issues

**Error**: `could not translate host name`

**Solution**: Use Session Pooler (port 6543), not direct connection

### Schema Drift Detected

**Error**: Prisma detects drift between schema.prisma and database

**Solution**:
```bash
# Pull current database state
pnpm prisma db pull

# Review changes
git diff prisma/schema.prisma

# Create migration to sync
pnpm prisma migrate dev --name "sync_schema"
```

---

## 📝 Migration Best Practices

### Before Creating Migration

1. **Test in dev database first**
2. **Review generated SQL** in `prisma/migrations/[timestamp]_[name]/migration.sql`
3. **Check for destructive operations** (DROP, DELETE, ALTER TYPE)
4. **Consider data migration** if changing existing column types

### Safe Migration Patterns

✅ **Safe**:
- Adding new tables
- Adding new columns with defaults
- Creating indexes
- Adding foreign keys

⚠️ **Requires Planning**:
- Changing column types
- Renaming columns/tables
- Adding NOT NULL to existing column
- Dropping columns (data loss!)

### Rollback Strategy

**Option A: Forward Migration (Recommended)**
```bash
# Fix in dev
pnpm prisma migrate dev --name "fix_issue"

# Test, then deploy
git push
```

**Option B: Point-in-Time Recovery (Emergency)**
```bash
# Use Supabase dashboard → Database → Backups
# Restore to point before bad migration
# Redeploy previous git commit
```

---

## 💰 Cost Breakdown

### Supabase Free Tier (per project)

- Database size: 500 MB
- Bandwidth: 2 GB/month
- Storage: 1 GB
- Compute: Unlimited

### Recommended Setup Costs

| Component | Tier | Cost/Month |
|-----------|------|------------|
| Dev Supabase | Free | $0 |
| Prod Supabase | Free (start) → Pro (scale) | $0 → $25 |
| **Total** | | **$0** (start) |

**When to upgrade production:**
- Database > 500 MB
- Need better performance
- Need more connections
- Want daily backups

---

## 🚀 Advanced: Alternative Approaches

### Option B: Local Supabase via Docker

If you prefer Docker over cloud dev database:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize
supabase init

# Start local instance
supabase start

# Update .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Apply migrations
pnpm prisma migrate deploy
```

**Pros**: Free, fast, complete isolation
**Cons**: Requires Docker, more complex setup

### Option C: `prisma db push` Workflow

If you want single database and fast iteration:

```bash
# Daily development (no migration files)
pnpm prisma db push

# When ready for production
pnpm prisma migrate dev --create-only --name "feature"
# Review SQL, then:
pnpm prisma migrate deploy
git push
```

**Pros**: Simple, fast iteration
**Cons**: No drift detection, no migration validation

**Recommendation**: Stick with Option A (two Supabase projects) for safety.

---

## 📚 Configuration Reference

### Prisma Schema (Current)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  // No shadowDatabaseUrl needed - Prisma auto-creates in dev project!
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:migrate:status:dev": "dotenv -e .env.local -- prisma migrate status",
    "db:migrate:dev": "dotenv -e .env.local -- npx prisma migrate dev",
    "db:validate": "dotenv -e .env.local -- prisma validate",
    "db:migrate:deploy:ci": "prisma migrate deploy",
    "db:migrate:status:ci": "prisma migrate status",
    "db:prisma:generate": "prisma generate --no-hints",
    "db:prisma:studio": "prisma studio"
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/database-migration.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

steps:
  - name: Run database migration
    run: pnpm run db:migrate:deploy:ci
  # No shadow DB needed in CI/CD
```

---

## 🎓 Understanding the Simplification

### What We Removed (Today's Work)

Before (Neon):
```bash
DATABASE_URL="..."                    # Pooled for runtime
DATABASE_URL_UNPOOLED="..."          # Direct for migrations
SHADOW_DATABASE_URL="..."            # Manual shadow DB
DATABASE_URL_NEONDB_OWNER="..."      # Owner role
```

After (Supabase):
```bash
DATABASE_URL="..."                    # One URL for everything!
```

### Why This Works

1. **Session Pooler (port 6543)** handles both runtime and migrations
2. **Separate dev project** gives Prisma permission to auto-create shadow DB
3. **Production uses `migrate deploy`** which doesn't need shadow DB
4. **Simpler = fewer variables to manage across environments**

---

## ✅ Post-Migration Checklist

- [ ] Dev database created and working
- [ ] Prod database migrated from Neon
- [ ] All Vercel environments updated
- [ ] Local development works: `pnpm run dev`
- [ ] Production deployment successful
- [ ] Shadow DB auto-creates during `prisma migrate dev`
- [ ] GitHub Actions migrations working
- [ ] Documentation updated (RUNBOOK.md)
- [ ] Old Neon backup kept for 1-2 weeks
- [ ] Team (you) knows new workflow

---

## 📖 Related Documentation

- [RUNBOOK.md](./RUNBOOK.md) - Daily operations and maintenance
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - Migration automation details
- [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) - Rollback procedures

---

## 🧘 Philosophy: Simplicity Through Separation

> "To attain knowledge, add things every day. To attain wisdom, subtract things every day."
> — Tao Te Ching

By adding one dev database, we subtract:
- ❌ Shadow database configuration complexity
- ❌ Multiple database URL variables
- ❌ Risk of breaking production during development
- ❌ Manual role provisioning scripts

**Result**: Simpler ongoing workflow, safer development, clearer mental model.

---

## 🎯 Summary

### What You Get

✅ **Two Supabase projects**: Dev (experiment freely) + Prod (protected)
✅ **One variable per environment**: Just `DATABASE_URL`
✅ **Auto shadow DB**: Prisma handles it, zero config
✅ **Simple workflow**: `migrate dev` locally → `git push` → deploys to prod
✅ **Free to start**: Both projects on free tier
✅ **Production-grade**: Follows Supabase + Prisma best practices

### Total Setup Time

- Create dev database: 15 min
- Migrate production: 30 min
- Update environment vars: 10 min
- Test & deploy: 10 min
- **Total: ~65 minutes**

### Ongoing Complexity

**Near zero** - just develop normally with `prisma migrate dev`.

---

**Ready to migrate? Start with Part 1 of the Quick Start Checklist above!** 🚀
