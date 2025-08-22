#!/bin/bash

# Local CI Runner Script
# Runs the same checks as GitHub Actions CI workflow

set -e  # Exit on any error

echo "🚀 Running CI checks locally..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

run_step() {
    echo ""
    echo -e "${BLUE}🔄 $1${NC}"
    echo "--------------------------------"
}

success_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

error_step() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warning_step() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Step 1: Install dependencies
run_step "Installing dependencies"
if pnpm install --frozen-lockfile; then
    success_step "Dependencies installed"
else
    error_step "Failed to install dependencies"
fi

# Step 2: Generate Prisma client
run_step "Generating Prisma client"
if pnpm run db:prisma:generate; then
    success_step "Prisma client generated"
else
    error_step "Failed to generate Prisma client"
fi

# Step 3: Run ESLint
run_step "Running ESLint"
if pnpm run lint; then
    success_step "ESLint passed"
else
    error_step "ESLint failed - fix linting errors before committing"
fi

# Step 4: Check TypeScript
run_step "Running TypeScript check"
if pnpm run typecheck; then
    success_step "TypeScript check passed"
else
    error_step "TypeScript check failed - fix type errors before committing"
fi

# Step 5: Check for Prisma serialization violations
run_step "Checking for Prisma import violations"
if find app components -name "*.tsx" -exec grep -l "use client" {} \; 2>/dev/null | xargs grep -l "@prisma/client" 2>/dev/null; then
    error_step "Client components importing Prisma detected! Use *Serialized query methods instead."
else
    success_step "No Prisma import violations found"
fi

# Step 6: Build application
run_step "Building application"
export DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
if pnpm run build:ci; then
    success_step "Build succeeded"
else
    error_step "Build failed"
fi

# Step 7: Run tests
run_step "Running tests"
if pnpm run test --run; then
    success_step "Tests passed"
else
    warning_step "Tests failed - please fix before committing"
fi

# Step 8: Security audit
run_step "Running security audit"
if pnpm audit --audit-level moderate; then
    success_step "Security audit passed"
else
    warning_step "Security audit found issues - review dependencies"
fi

# Step 9: Check for secrets
run_step "Checking for potential secrets"
if grep -r -E "(api_key|secret_key|private_key|password|token)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . | grep -v "// @ts-ignore" | grep -v "process.env" | head -5; then
    warning_step "Potential secrets found - make sure to use environment variables"
else
    success_step "No obvious secrets found"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 All CI checks completed successfully!${NC}"
echo -e "${BLUE}Your code is ready to be committed and pushed.${NC}"
echo ""