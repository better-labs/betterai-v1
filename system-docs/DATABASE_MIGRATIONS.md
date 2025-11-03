# Database Migrations Guide

This document outlines the production database migration strategy for BetterAI using GitHub Actions and Prisma.

## Overview

Our database migration strategy follows these principles:
- **Safety First**: Validate migrations before deployment
- **Zero-Downtime**: Use proper database roles and connection pooling
- **Rollback Ready**: Maintain ability to revert changes when needed
- **Automated**: Trigger migrations via GitHub Actions on schema changes

## Architecture

### Database Connection
- **Supabase Session Pooler**: Single connection for both runtime and migrations
- **`DATABASE_URL`**: Supabase Session Pooler (port 6543) - works for everything

## Migration Workflow

### Automatic Migration (Recommended)

1. **Developer creates migration**:
   ```bash
   # Create and apply migration locally
   pnpm prisma migrate dev --name "add_new_feature"
   ```

2. **Push to main branch**:
   ```bash
   git add prisma/
   git commit -m "feat: add new database feature"
   git push origin main
   ```

3. **GitHub Actions automatically**:
   - Detects schema/migration changes
   - Validates migration safety
   - Runs migration in production
   - Triggers Vercel redeployment

### Manual Review Process

For potentially destructive migrations, use manual review:

1. **Trigger manual review**:
   - Go to GitHub Actions
   - Run "Production Database Migration" workflow
   - Select "manual-review" type

2. **Review and approve**:
   - Check migration files for destructive operations
   - Consider data backup if needed
   - Re-run workflow with "auto" type

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

```bash
# Production database (Supabase Session Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Vercel deploy hook for automatic redeployment
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

### Environment Protection

1. Go to GitHub Settings → Environments
2. Create "production" environment
3. Add required reviewers (optional)
4. Set deployment timeout

## Migration Best Practices

### Safe Migration Patterns

✅ **Safe Operations**:
- Adding new tables
- Adding new columns (with defaults)
- Creating indexes (online)
- Adding foreign keys with validation

✅ **Safe Column Changes**:
```sql
-- Add new column with default
ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT '';

-- Populate data
UPDATE users SET email = 'user@example.com' WHERE email = '';

-- Add constraint after data population
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

### Potentially Dangerous Operations

⚠️ **Review Required**:
- Dropping columns or tables
- Changing column types
- Removing indexes
- Adding non-null columns without defaults

⚠️ **Dangerous Example**:
```sql
-- This will be flagged for review
ALTER TABLE users DROP COLUMN old_field;
```

### Zero-Downtime Strategies

For complex migrations, use multiple deployments:

**Step 1**: Add new column (backward compatible)
```sql
ALTER TABLE users ADD COLUMN new_email VARCHAR(255);
```

**Step 2**: Deploy application changes to populate new column

**Step 3**: Make new column required
```sql
ALTER TABLE users ALTER COLUMN new_email SET NOT NULL;
```

**Step 4**: Remove old column
```sql
ALTER TABLE users DROP COLUMN old_email;
```

## Emergency Procedures

### Migration Rollback

**Automatic rollback** (limited scenarios):
```bash
# Via GitHub Actions UI
# Select "rollback" type and specify target migration
```

**Manual rollback** (most cases):
1. Create reverse migration
2. Test locally first
3. Deploy via normal workflow

### Production Issues

If migration fails in production:

1. **Check GitHub Actions logs**
2. **Verify database state**:
   ```bash
   npx prisma migrate status
   ```
3. **Manual intervention** (if needed):
   ```bash
   # Connect to production DB
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

## Local Development

### Creating Migrations

```bash
# Standard migration creation
pnpm prisma migrate dev --name "descriptive_name"

# Reset local database (destructive)
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status
```

### Testing Migrations

```bash
# Apply to local DB
pnpm run db:migrate:deploy:dev

# Generate Prisma client
pnpm run db:prisma:generate

# Seed data
pnpm run db:seed
```

## Monitoring and Observability

### Migration Logs
- GitHub Actions provides detailed logs
- Vercel deployment logs show redeployment
- Database connection logs in Neon dashboard

### Health Checks
- Prisma migrate status
- Application startup success
- Cron job functionality

## Advanced Scenarios

### Large Data Migrations

For migrations affecting millions of rows:

1. **Create migration with batching**:
   ```sql
   -- Use batch updates with limits
   UPDATE large_table SET new_column = 'value' WHERE id BETWEEN 1 AND 10000;
   ```

2. **Consider background processing**:
   - Create migration for schema only
   - Use application code for data migration
   - Monitor progress via logs

### Multi-Environment Coordination

1. **Preview deployments** use database branches
2. **Production** uses main database
3. **Coordination** via GitHub branch protection

## Troubleshooting

### Common Issues

**Migration stuck in "pending" state**:
```bash
# Check what's blocking
npx prisma migrate status
# Manual intervention may be required
```

**Vercel deployment fails after migration**:
- Check environment variables are updated
- Verify Prisma client generation
- Check application startup logs

**Database connection issues**:
- Verify `DATABASE_URL_UNPOOLED` is correct
- Check database role permissions
- Confirm network connectivity

### Recovery Procedures

1. **Identify the issue** via logs
2. **Assess impact** on production
3. **Choose recovery strategy**:
   - Fix forward (new migration)
   - Rollback (reverse migration)
   - Manual intervention
4. **Validate fix** in staging first
5. **Deploy fix** via standard workflow

## Security Considerations

- Migration secrets stored in GitHub Secrets
- Database admin role used only for migrations
- Application runtime uses limited role
- All connections use SSL/TLS
- Environment protection for production

## Integration with Vercel

The migration workflow integrates with Vercel:

1. **Migration runs first** (GitHub Actions)
2. **Triggers redeployment** (Vercel Deploy Hook)
3. **Application starts** with new schema
4. **Cron jobs resume** with updated database

This ensures the application never runs with mismatched schema.
