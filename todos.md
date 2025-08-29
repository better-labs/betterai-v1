# Add Loops.so Integration to User Registration

## Overview
Integrate Loops.so email marketing platform into the user registration flow to automatically add new users to a mailing list. This will enhance user engagement and marketing capabilities.

## Current User Flow
- **API Endpoint**: `POST /app/api/user/route.ts`
- **Service**: `lib/services/user-service.ts::upsertUser()`
- **Database**: Prisma User model with fields: `id`, `email`, `username`, `walletAddress`, `avatar`

## Implementation Plan

### 1. Environment Setup
- [ ] Add `LOOPS_API_KEY` environment variable to Vercel (dev, preview, production)
  ```bash
  # Add to all environments
  vercel env add LOOPS_API_KEY --environment=development
  vercel env add LOOPS_API_KEY --environment=preview
  vercel env add LOOPS_API_KEY --environment=production
  ```
- [ ] Update `.env.example` to include the new variable
- [ ] Pull development environment variables: `pnpm run env:pull:dev`

### 2. Create Loops Service
- [ ] Create `/lib/services/loops-service.ts` with the following functionality:
  - Clean service pattern (accepts db parameter for dependency injection)
  - `createContact()` function that calls Loops API
  - Error handling and logging
  - TypeScript interfaces for Loops API responses
  - Rate limiting consideration for API calls

### 3. Enhance User Service
- [ ] Modify `lib/services/user-service.ts::upsertUser()` to:
  - Call Loops service after successful database upsert
  - Handle Loops API failures gracefully (don't block user registration)
  - Log Loops integration results for monitoring
  - Map user data appropriately:
    - `firstName` = `username` (or first part if contains spaces)
    - `email` = `email`
    - `mailingLists` = `{ "cmel7blt51ca10izy3kyb7pn3": true }`

### 4. API Integration Details
- [ ] **Loops API Endpoint**: `https://app.loops.so/api/v1/contacts/create`
- [ ] **Request Payload**:
  ```json
  {
    "email": "user@example.com",
    "firstName": "username",
    "mailingLists": {
      "cmel7blt51ca10izy3kyb7pn3": true
    }
  }
  ```
- [ ] **Authentication**: Bearer token with `LOOPS_API_KEY`
- [ ] **Error Handling**: Non-blocking (log errors but don't fail user registration)

### 5. Testing Strategy
- [ ] Create `/tests/services/loops-service.test.ts` with:
  - Mock HTTP requests using Vitest
  - Test successful contact creation
  - Test API error scenarios
  - Test malformed data handling
  - Integration test with user service
- [ ] Test script: `pnpm run test -- tests/services/loops-service.test.ts`

### 6. Monitoring & Error Handling
- [ ] Add structured logging for Loops API calls
- [ ] Implement retry logic for transient failures
- [ ] Add metrics for success/failure rates
- [ ] Ensure graceful degradation (user registration succeeds even if Loops fails)

### 7. Documentation Updates
- [ ] Update `.env.example` with Loops API key documentation
- [ ] Add comments in user service explaining Loops integration
- [ ] Update system documentation if needed

## Success Criteria
- ✅ New users are automatically added to Loops mailing list
- ✅ User registration flow remains fast and reliable
- ✅ Proper error handling and logging
- ✅ Comprehensive test coverage
- ✅ Environment variables properly configured
- ✅ No breaking changes to existing functionality

## Rollback Plan
- Remove Loops API calls from user service
- Keep Loops service for future use
- Environment variables can remain (no harm if unused)

## Dependencies
- Loops API key: `bc2ea891339005bb1ef23909d2209c4e`
- Mailing list ID: `cmel7blt51ca10izy3kyb7pn3`
- No additional npm packages required (use native fetch)

## Testing Commands
```bash
# Run all tests
pnpm run test

# Run specific Loops service tests
pnpm run test -- tests/services/loops-service.test.ts

# Run with environment variables
dotenv -e .env.local -- pnpm run test
```

This plan follows the established patterns in the codebase and ensures minimal disruption to the existing user registration flow.
