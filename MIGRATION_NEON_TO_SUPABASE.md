# Database Migration: Neon → Supabase

Simple step-by-step guide to migrate your database from Neon to Supabase.

## Prerequisites

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project's connection details

2. **Get Connection Strings from Supabase**
   - Go to Project Settings → Database
   - **IMPORTANT: IPv4 Compatibility Issue**
     - Supabase direct connections are IPv6-only by default
     - If you see "Not IPv4 compatible" warning → Use **Session Pooler** instead
     - Session Pooler works for both runtime AND migrations on IPv4 networks
   - Copy:
     - **Connection Pooling** → "Session mode" (for `DATABASE_URL` - pooled connection)
     - **Connection Pooling** → "Session mode" (for `DATABASE_URL_UNPOOLED` - migrations on IPv4)
     - For shadow database: use the same Session Pooler connection

3. **Install pg_dump and psql** (if not already installed)
   ```bash
   # macOS
   brew install postgresql
   
   # Or verify you have them:
   which pg_dump
   which psql
   ```

---

## Step 1: Dump Data from Neon

```bash
# Export your current Neon DATABASE_URL from .env.local
# Run this command (replace with your actual Neon connection string):
pg_dump "YOUR_NEON_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --format=custom \
  --file=neon-backup.dump
```

**Note**: If you need the connection string, run:
```bash
cat .env.local | grep DATABASE_URL
```

---

## Step 2: Create Shadow Database Schema in Supabase

Since Supabase doesn't use schema-based shadow databases the same way, you have two options:

**Option A (Recommended):** Use a separate shadow database
1. Create a second Supabase project for shadow database
2. Or create a separate schema in the same database

**Option B (Simpler):** Use the same connection for shadow (not ideal but works)
- Use the same `DATABASE_URL_UNPOOLED` for both main and shadow

For now, let's use Option B to keep it simple:

```bash
# Your Supabase shadow URL will be the same as DATABASE_URL_UNPOOLED
# We'll set this up in the .env.local file
```

---

## Step 3: Restore Data to Supabase

```bash
# First, ensure your Supabase database is ready
# Get your Supabase connection string from the dashboard

# IMPORTANT: If you see "Not IPv4 compatible" warning in Supabase:
# → Use Session Pooler connection string (Session mode) instead of Direct connection
# → Session Pooler works for migrations on IPv4 networks

# Restore the dump (replace with your Supabase connection string):
pg_restore \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -d "YOUR_SUPABASE_CONNECTION_STRING" \
  neon-backup.dump
```

**If you get errors about existing objects**, use this safer approach:
```bash
pg_restore \
  --no-owner \
  --no-acl \
  -d "YOUR_SUPABASE_CONNECTION_STRING" \
  --verbose \
  neon-backup.dump
```

**Note on IPv4/IPv6:**
- If direct connection fails (hostname not resolving), use Session Pooler
- Session Pooler format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- Port `6543` is for Session mode (good for migrations)
- Port `5432` is for Transaction mode (faster, but not ideal for migrations)

---

## Step 4: Update Local .env.local

```bash
# Backup your current .env.local
cp .env.local .env.local.backup

# Edit .env.local and update these variables:
```

**Update in `.env.local`:**
```bash
# Replace Neon URLs with Supabase URLs
# IMPORTANT: If you're on IPv4 and see "Not IPv4 compatible", use Session Pooler for all three

# Option 1: If you have IPv6 access (direct connection works):
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SHADOW_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Option 2: If IPv4 only (use Session Pooler for all - RECOMMENDED):
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
DATABASE_URL_UNPOOLED="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
SHADOW_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

**How to get Supabase connection strings:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Under "Connection string":
   - If you see **"Not IPv4 compatible"** warning:
     - Click "Pooler settings" or switch to "Session mode" in dropdown
     - Use **Session Pooler** (port 6543) for ALL three variables
     - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - If direct connection works (IPv6):
     - "Session mode" (for pooled) → use for `DATABASE_URL`
     - "Direct connection" → use for `DATABASE_URL_UNPOOLED` and `SHADOW_DATABASE_URL`
3. Replace `[YOUR-PASSWORD]` with your database password

---

## Step 5: Test Locally

```bash
# 1. Regenerate Prisma client
pnpm prisma generate

# 2. Check migration status
pnpm run db:migrate:status:dev

# 3. Verify schema matches
pnpm run db:validate

# 4. Test your app
pnpm run dev

# 5. Test database operations (run a simple query or test script)
```

**Quick sanity check:**
```bash
# Count records in a key table
pnpm prisma studio
# Open browser, check that your data is there
```

---

## Step 6: Verify Data Integrity

Run these checks:

```bash
# Check row counts match between old and new (manually compare)
# In Prisma Studio or via SQL:
psql "YOUR_SUPABASE_DIRECT_CONNECTION_STRING" -c "SELECT COUNT(*) FROM users;"
psql "YOUR_SUPABASE_DIRECT_CONNECTION_STRING" -c "SELECT COUNT(*) FROM markets;"
psql "YOUR_SUPABASE_DIRECT_CONNECTION_STRING" -c "SELECT COUNT(*) FROM predictions;"
```

---

## Step 7: Update Production Environment Variables

### Via Vercel Dashboard:
1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Update for **Production**:
   - `DATABASE_URL` → Your Supabase pooled connection string
   - `DATABASE_URL_UNPOOLED` → Your Supabase direct connection string
   - `SHADOW_DATABASE_URL` → Your Supabase direct connection string (same as UNPOOLED)

3. Update for **Preview**:
   - Same three variables with Supabase connection strings

### Via Vercel CLI:
```bash
# Set production variables
vercel env add DATABASE_URL production
# Paste your Supabase pooled connection string when prompted

vercel env add DATABASE_URL_UNPOOLED production
# Paste your Supabase direct connection string

vercel env add SHADOW_DATABASE_URL production
# Paste your Supabase direct connection string

# Repeat for preview environment
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL_UNPOOLED preview
vercel env add SHADOW_DATABASE_URL preview
```

---

## Step 8: Deploy and Monitor

```bash
# After updating env vars, trigger a deployment
git commit --allow-empty -m "chore: switch database to Supabase"
git push origin main
```

**Monitor:**
- Check Vercel deployment logs
- Check Supabase dashboard → Database → Connection Pooling for active connections
- Test key functionality in production

---

## Troubleshooting

### IPv4/IPv6 Connection Issues
- **Error: "could not translate host name" or "Unknown host"**
  - Your network is IPv4-only, but Supabase direct connections are IPv6-only
  - **Solution**: Use Session Pooler instead (Session mode, port 6543)
  - Go to Supabase Dashboard → Settings → Database → Connection string
  - Switch dropdown to "Session mode" and use that connection string
  - This works for both runtime AND migrations

### Migration errors
- If `pg_restore` fails, try restoring without `--clean` flag first
- Check Supabase connection limits and upgrade if needed
- If using Session Pooler, make sure you're using port 6543 (Session mode), not 5432 (Transaction mode)

### Connection pool errors
- Supabase free tier has connection limits
- Use connection pooling (`pgbouncer=true`) in `DATABASE_URL`
- Session Pooler works fine for migrations on IPv4 networks

### Schema mismatches
- Run `pnpm prisma migrate deploy` in production after switch
- Check that all migrations are applied: `pnpm run db:migrate:status:dev`

---

## Cleanup (After Successful Migration)

Once everything works:
```bash
# Keep the backup for a week or two, then:
rm neon-backup.dump
rm .env.local.backup
```

---

## Quick Reference: Supabase Connection Strings Format

```
# Session Pooler (IPv4 compatible - RECOMMENDED for all)
# Port 6543 = Session mode (good for migrations)
# Port 5432 = Transaction mode (faster, but less ideal for migrations)
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Direct Connection (IPv6 only - only use if your network supports IPv6)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Get these from:** Supabase Dashboard → Project Settings → Database → Connection string

**If you see "Not IPv4 compatible" warning:**
- Click "Pooler settings" or select "Session mode"
- Use the Session Pooler connection string (port 6543) for all three variables
- This is the recommended approach for IPv4 networks
