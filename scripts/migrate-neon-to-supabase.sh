#!/bin/bash

# Database Migration Helper: Neon → Supabase
# Usage: ./scripts/migrate-neon-to-supabase.sh

set -e  # Exit on error

echo "🚀 Neon → Supabase Migration Helper"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Install PostgreSQL: brew install postgresql${NC}"
    exit 1
fi

if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}❌ pg_restore not found. Install PostgreSQL: brew install postgresql${NC}"
    exit 1
fi

if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found. Make sure you're in the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Step 1: Extract Neon connection string
echo "🔍 Extracting Neon DATABASE_URL from .env.local..."
NEON_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$NEON_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env.local${NC}"
    echo "Please enter your Neon connection string:"
    read -r NEON_URL
fi

# Step 2: Dump from Neon
echo ""
echo "📦 Step 1: Dumping data from Neon..."
BACKUP_FILE="neon-backup-$(date +%Y%m%d-%H%M%S).dump"
pg_dump "$NEON_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Step 3: Get Supabase connection string
echo ""
echo "📥 Step 2: Restore to Supabase"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: IPv4 Compatibility${NC}"
echo "If you see 'Not IPv4 compatible' in Supabase, use Session Pooler instead of Direct connection."
echo ""
echo "Please enter your Supabase connection string:"
echo "  - Session Pooler (Session mode, port 6543) - RECOMMENDED for IPv4"
echo "  - Or Direct connection (port 5432) - Only if IPv6 available"
echo ""
echo "Get it from: Supabase Dashboard → Settings → Database → Connection string"
echo "Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
read -r SUPABASE_URL

# Step 4: Test Supabase connection
echo ""
echo "🔌 Testing Supabase connection..."
if psql "$SUPABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your connection string.${NC}"
    echo "Common issues:"
    echo "  - IPv4 network: Use Session Pooler (port 6543) instead of Direct connection"
    echo "  - Wrong password: Verify in Supabase dashboard"
    echo "  - Network issues: Check firewall/network settings"
    exit 1
fi

# Step 5: Restore to Supabase
echo ""
echo "🔄 Restoring data to Supabase..."
pg_restore \
  --no-owner \
  --no-acl \
  -d "$SUPABASE_URL" \
  --verbose \
  "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data restored to Supabase${NC}"
else
    echo -e "${YELLOW}⚠️  Restore completed with warnings (check output above)${NC}"
    echo "Some errors are normal if objects already exist."
fi

# Step 6: Update .env.local
echo ""
echo "📝 Step 3: Update .env.local"
echo ""
echo -e "${YELLOW}💡 Tip: For IPv4 networks, use Session Pooler for all three variables${NC}"
echo ""
echo "Please enter your Supabase connection strings:"
echo ""
echo "1. Runtime connection (for DATABASE_URL):"
echo "   Recommended: Transaction mode (port 5432) - faster for queries"
echo "   Example: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
read -r SUPABASE_POOLED
echo ""
echo "2. Migration connection (for DATABASE_URL_UNPOOLED):"
echo "   Recommended: Session mode (port 6543) - better for migrations"
echo "   Example: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
read -r SUPABASE_DIRECT

# Backup .env.local
cp .env.local .env.local.backup-$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✅ Backed up .env.local${NC}"

# Update .env.local (sed works differently on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_POOLED\"|" .env.local
    sed -i '' "s|^DATABASE_URL_UNPOOLED=.*|DATABASE_URL_UNPOOLED=\"$SUPABASE_DIRECT\"|" .env.local
    sed -i '' "s|^SHADOW_DATABASE_URL=.*|SHADOW_DATABASE_URL=\"$SUPABASE_DIRECT\"|" .env.local
else
    # Linux
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_POOLED\"|" .env.local
    sed -i "s|^DATABASE_URL_UNPOOLED=.*|DATABASE_URL_UNPOOLED=\"$SUPABASE_DIRECT\"|" .env.local
    sed -i "s|^SHADOW_DATABASE_URL=.*|SHADOW_DATABASE_URL=\"$SUPABASE_DIRECT\"|" .env.local
fi

echo -e "${GREEN}✅ Updated .env.local${NC}"

# Step 7: Test
echo ""
echo "🧪 Step 4: Testing..."
echo "Regenerating Prisma client..."
pnpm prisma generate

echo ""
echo "Checking migration status..."
pnpm run db:migrate:status:dev || echo -e "${YELLOW}⚠️  Migration check failed - this is OK if schema already matches${NC}"

echo ""
echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo "Summary of connection strings used:"
echo "  DATABASE_URL: $SUPABASE_POOLED"
echo "  DATABASE_URL_UNPOOLED: $SUPABASE_DIRECT"
echo "  SHADOW_DATABASE_URL: $SUPABASE_DIRECT"
echo ""
echo "Next steps:"
echo "1. Test your app: pnpm run dev"
echo "2. Verify data: pnpm prisma studio"
echo "3. Update Vercel env vars (production & preview):"
echo "   - Use the same 3 connection strings above"
echo "   - Session Pooler (port 6543) recommended for migrations"
echo "   - Transaction Pooler (port 5432) OK for runtime"
echo ""
echo "Backup file saved: $BACKUP_FILE"
echo "Keep it for a week or two before deleting."
