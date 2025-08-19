# Database Migration Rollback Strategy

This document outlines the rollback strategies for database migrations in production, covering both automated and manual approaches.

## Overview

Database rollbacks are complex operations that require careful planning. Unlike application deployments, database changes often cannot be automatically reversed due to:
- Data dependencies
- One-way transformations
- Referential integrity constraints
- Data loss potential

## Rollback Categories

### 1. Schema-Only Changes (Safe)
These can often be rolled back automatically:
- Adding new tables (unused by application)
- Adding new columns with defaults
- Creating indexes
- Adding foreign keys

### 2. Data Transformations (Manual Review Required)
These require careful manual planning:
- Column type changes
- Data migrations
- Constraint additions with data validation
- Renaming columns/tables

### 3. Destructive Changes (Recovery Strategy Required)
These need backup/recovery procedures:
- Dropping columns
- Dropping tables
- Removing constraints with data cleanup

## Rollback Strategies

### Strategy 1: Forward Migration (Recommended)

Create a new migration that reverses the changes:

```bash
# Create new migration to fix issues
pnpm run db:migrate:dev --name "rollback_problematic_feature"
```

**Example - Rolling back a column addition**:
```sql
-- Original migration: 20240115_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Rollback migration: 20240115_remove_user_preferences.sql
ALTER TABLE users DROP COLUMN preferences;
```

### Strategy 2: Point-in-Time Recovery (Emergency)

Use database backup restoration for critical failures:

1. **Identify recovery point** (before problematic migration)
2. **Restore from backup** (requires downtime)
3. **Replay safe migrations** (if any occurred after backup)
4. **Update application** to match restored schema

### Strategy 3: Blue-Green Database (Advanced)

For zero-downtime rollbacks of complex changes:

1. **Maintain parallel database** with previous schema
2. **Switch application traffic** to old database
3. **Fix issues** in new database
4. **Switch back** when ready

## Implementation Guide

### Automated Rollback Detection

The GitHub Actions workflow includes basic rollback detection:

```yaml
- name: Detect rollback scenario
  run: |
    # Check if this is a rollback commit
    if git log --oneline -10 | grep -i "rollback\|revert"; then
      echo "rollback_detected=true" >> $GITHUB_OUTPUT
    fi
```

### Manual Rollback Process

1. **Assess the situation**:
   ```bash
   # Check current migration status
   pnpm run db:migrate:status
   
   # Check application health
   curl -f $PRODUCTION_URL/api/health
   ```

2. **Plan the rollback**:
   - Identify affected tables/data
   - Determine rollback method
   - Plan for data preservation

3. **Execute rollback**:
   ```bash
   # Option A: Create reverse migration
   pnpm run db:migrate:dev --name "rollback_feature_x"
   
   # Option B: Manual SQL (emergency only)
   # Connect to production DB and execute reverse SQL
   ```

4. **Verify rollback**:
   ```bash
   # Check schema state
   pnpm run db:migrate:status
   
   # Test application functionality
   # Run critical user flows
   ```

## Rollback Examples

### Example 1: Adding and Removing a Column

**Original Migration**:
```sql
-- 20240115120000_add_user_metadata.sql
ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT '{}';
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);
```

**Rollback Migration**:
```sql
-- 20240115130000_remove_user_metadata.sql
DROP INDEX IF EXISTS idx_users_metadata;
ALTER TABLE users DROP COLUMN IF EXISTS metadata;
```

### Example 2: Column Type Change with Data

**Original Migration**:
```sql
-- 20240115120000_change_price_precision.sql
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,4);
```

**Rollback Strategy** (requires data assessment):
```sql
-- Check if precision loss would occur
SELECT COUNT(*) FROM products 
WHERE price::DECIMAL(10,2) != price;

-- If no precision loss:
-- 20240115130000_rollback_price_precision.sql
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2);

-- If precision loss would occur:
-- Manual intervention required
```

### Example 3: Table Rename

**Original Migration**:
```sql
-- 20240115120000_rename_user_profiles.sql
ALTER TABLE user_profiles RENAME TO profiles;
```

**Rollback Migration**:
```sql
-- 20240115130000_restore_user_profiles_name.sql
ALTER TABLE profiles RENAME TO user_profiles;
```

## Emergency Procedures

### Immediate Rollback (Application Level)

If migration causes immediate issues:

1. **Revert application deployment**:
   ```bash
   # Via Vercel dashboard or CLI
   vercel rollback --timeout=30s
   ```

2. **Disable problematic features**:
   ```bash
   # Update feature flags
   curl -X POST "$VERCEL_API/env" \
     -d '{"key": "FEATURE_X_ENABLED", "value": "false"}'
   ```

3. **Execute database rollback** (after application is stable)

### Database Connection Issues

If migration breaks database connectivity:

1. **Use direct database connection**:
   ```bash
   # Bypass application, connect directly to Neon
   psql $DATABASE_URL_UNPOOLED
   ```

2. **Check migration status**:
   ```sql
   SELECT * FROM _prisma_migrations 
   ORDER BY started_at DESC LIMIT 5;
   ```

3. **Manual migration rollback**:
   ```sql
   -- Mark migration as rolled back
   UPDATE _prisma_migrations 
   SET finished_at = NULL, migration_name = migration_name || '_rolled_back'
   WHERE migration_name = 'problematic_migration';
   
   -- Execute reverse SQL manually
   -- (specific to the migration being rolled back)
   ```

## Best Practices for Rollback-Ready Migrations

### 1. Make Migrations Reversible

Design migrations with rollback in mind:

```sql
-- Good: Reversible
ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT '';

-- Rollback:
ALTER TABLE users DROP COLUMN email;
```

```sql
-- Bad: Hard to reverse
UPDATE users SET email = LOWER(email);  -- Data transformation
```

### 2. Use Migration Comments

Document rollback procedures in migration files:

```sql
-- Migration: Add user email verification
-- Rollback: DROP COLUMN email_verified; DROP INDEX idx_users_email_verified;
-- Data impact: No data loss expected

ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

### 3. Test Rollback Procedures

Include rollback testing in development:

```bash
# Test migration
pnpm run db:migrate:dev --name "test_feature"

# Test rollback
pnpm run db:migrate:dev --name "rollback_test_feature"

# Verify no data loss
```

### 4. Backup Before Destructive Changes

For any potentially destructive migration:

```sql
-- Create backup table before changes
CREATE TABLE users_backup_20240115 AS SELECT * FROM users;

-- Perform migration
ALTER TABLE users DROP COLUMN old_field;

-- Note: Remember to clean up backup tables after successful migration
```

## Monitoring and Alerting

### Migration Health Checks

Set up monitoring for:
- Migration completion status
- Application startup success after migration
- Database connection health
- Critical user flows

### Alerting Thresholds

Configure alerts for:
- Migration runtime > 5 minutes
- Application errors > 1% after migration
- Database connection failures
- Failed cron jobs after migration

### Rollback Triggers

Automatic rollback consideration for:
- Application startup failures
- Database connection timeouts
- Critical endpoint failures > 50%
- User-reported data inconsistencies

## Communication Plan

### During Rollback

1. **Notify stakeholders** of the issue
2. **Provide ETA** for resolution
3. **Document actions taken**
4. **Confirm resolution**

### Post-Rollback

1. **Root cause analysis**
2. **Update migration procedures**
3. **Improve testing coverage**
4. **Share lessons learned**

## Tools and Scripts

### Rollback Helper Script

```bash
#!/bin/bash
# scripts/rollback-migration.sh

MIGRATION_NAME=$1
if [ -z "$MIGRATION_NAME" ]; then
  echo "Usage: $0 <migration_name>"
  exit 1
fi

echo "Creating rollback migration for: $MIGRATION_NAME"
echo "Please implement reverse operations manually."

pnpm run db:migrate:dev --name "rollback_${MIGRATION_NAME}"
```

### Database State Checker

```bash
#!/bin/bash
# scripts/check-db-state.sh

echo "Checking database state..."
pnpm run db:migrate:status
echo "Checking application health..."
curl -f $NEXT_PUBLIC_APP_URL/api/health
echo "Checking recent migrations..."
psql $DATABASE_URL_UNPOOLED -c "
  SELECT migration_name, started_at, finished_at 
  FROM _prisma_migrations 
  ORDER BY started_at DESC 
  LIMIT 5;"
```

## Recovery Scenarios

### Scenario 1: Migration Timeout

**Symptoms**: Migration hangs or times out
**Action**: 
1. Check database locks
2. Kill long-running queries if safe
3. Retry migration or rollback

### Scenario 2: Data Corruption

**Symptoms**: Data inconsistencies after migration
**Action**:
1. Stop writes to affected tables
2. Assess extent of corruption
3. Restore from backup if necessary
4. Replay safe operations

### Scenario 3: Application Compatibility

**Symptoms**: App fails to start with new schema
**Action**:
1. Rollback application deployment first
2. Fix schema compatibility issues
3. Create corrective migration
4. Redeploy with fixes

Remember: **Safety first** - when in doubt, prefer application rollback over database rollback to maintain data integrity.
