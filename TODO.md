# Inngest Migration Plan: Complete Cron Job Takeover

**Goal: Eliminate all Vercel cron dependency and migrate to 100% Inngest-managed scheduling**

## COMPLETE: Phase 1: Inngest Foundation & Initial Migration (Lower Risk)

### Setup & Account Creation
- [x] **Create Inngest Account** - Sign up at inngest.com with GitHub
- [x] **Install Dependencies** locally first (`pnpm add inngest`)
- [ ] **Create basic Inngest code structure** (client + API route)
- [ ] **Deploy to Vercel** to establish webhook endpoint
- [ ] **Configure Vercel sync** in Inngest dashboard (Step 3 of 4 in your screenshot)
- [ ] **Test webhook connectivity** and sync

### Code Changes - Batch Jobs

#### 1. Create Inngest Client (Already installed above)
- [ ] **Create** `lib/inngest/client.ts` with app ID only (no env keys needed initially)

#### 2. Create Batch Prediction Function (Native Inngest Cron)
- [ ] **Create** `lib/inngest/functions/batch-predictions.ts`
  - Convert to Inngest scheduled function (no events needed)
  - Use native cron scheduling: `{ cron: 'TZ=UTC 0 6 * * *' }`
  - Implement step-by-step processing for each model
  - Add proper error handling and retries

#### 3. Create Inngest API Route
- [ ] **Create** `app/api/inngest/route.ts`
  - Inngest webhook handler for Vercel
  - Register batch prediction function
  - Handle Inngest HTTP requests

#### 4. Remove Batch Cron Endpoint
- [ ] **Delete** `app/api/cron/daily-generate-batch-predictions/route.ts` (no longer needed)
- [ ] **Remove cron config** from `vercel.json` for batch predictions
- [ ] **Test** that Inngest scheduled function runs correctly

#### 5. Testing & Validation
- [ ] **Test locally** with Inngest Dev Server (`npx inngest-cli dev`)
- [ ] **Deploy to staging** and verify webhook connectivity
- [ ] **Monitor** first production batch job execution
- [ ] **Validate** BetterStack heartbeat still works

### Rollback Plan
- [ ] Keep original batch function as fallback
- [ ] Feature flag to switch between old/new implementation

---

## Phase 2: Complete Vercel Cron Elimination (Medium Risk)

### Migrate All Remaining Cron Jobs to Inngest Native Scheduling

**Objective: Zero Vercel cron dependencies - 100% Inngest-managed scheduling**

#### All Cron Jobs for Migration:
- [ ] **daily-update-polymarket-data** - Sync Polymarket events and markets (`cron: '0 6 * * *'`)
- [ ] **prediction-check** - Validate and score existing predictions (`cron: '0 */4 * * *'`)
- [ ] **session-recovery** - Recover stuck prediction sessions (`cron: '*/10 * * * *'`)
- [ ] **update-active-events** - Update active event status (`cron: '0 */2 * * *'`)
- [ ] **update-ai-models** - Refresh available AI model list (`cron: '0 0 * * 0'`)

#### Architecture Change:
```typescript
// ELIMINATE: Vercel cron → API route → logic
// IMPLEMENT: Inngest native cron → logic directly (no API routes)

export const updatePolymarketData = inngest.createFunction(
  { 
    id: 'update-polymarket-data',
    retries: 3,
    timeout: '10m'
  },
  { cron: 'TZ=UTC 0 6 * * *' }, // Native Inngest scheduling
  async ({ step }) => {
    // Import and execute service directly
    const { updatePolymarketEventsAndMarketData } = await import('@/lib/services/...')
    return await step.run('update-data', () => updatePolymarketEventsAndMarketData())
  }
)
```

#### Migration Steps:
1. **Create 5 new Inngest scheduled functions** in `lib/inngest/functions/cron/`
2. **Register all functions** in `/api/inngest/route.ts`
3. **Test each function** individually in Inngest dashboard
4. **Remove all `/api/cron/` endpoints** (complete directory deletion)
5. **Remove ALL cron configuration** from `vercel.json`
6. **Verify Inngest scheduling** is working for all jobs

#### Benefits:
- **Complete vendor independence** - No Vercel cron dependency
- **Superior scheduling** - Better timezone handling, more flexible expressions
- **Unified monitoring** - All jobs visible in single Inngest dashboard
- **Enhanced reliability** - Inngest's purpose-built cron vs Vercel's general-purpose
- **Cleaner codebase** - Eliminate entire `/api/cron/` directory

---

## Phase 3: Real-time Prediction Flow (Higher Risk)

### Code Changes - Interactive Sessions

#### 1. Create Prediction Session Function
- [ ] **Create** `lib/inngest/functions/prediction-sessions.ts`
  - Convert `executePredictionSession()` to Inngest function
  - Handle event: `prediction.session.requested`
  - Implement sequential model processing with steps
  - Add credit validation and refund logic

#### 2. Update Prediction Session Service
- [ ] **Modify** `lib/services/prediction-session-service.ts`
  - Add function to send Inngest events
  - Keep existing DTO patterns
  - Add `QUEUED` status to session enum

#### 3. Update tRPC Router
- [ ] **Modify** `lib/trpc/routers/prediction-sessions.ts`
  - Replace direct worker execution
  - Send Inngest event on session creation
  - Update status polling to handle `QUEUED` state

#### 4. Update Frontend Components
- [ ] **Modify** `app/predict/[marketId]/PredictionGenerator.tsx`
  - Handle new `QUEUED` status in UI
  - Update loading states and messages
  - Ensure polling continues during queue processing

#### 5. Update Recovery Service
- [ ] **Modify** `lib/services/prediction-session-recovery.ts`
  - Handle stuck sessions that are `QUEUED` but not processing
  - Add logic to re-trigger Inngest events for recovery
  - Update cleanup logic for new status

#### 6. Security & Validation
- [ ] **Add event data validation** schemas for all Inngest events (`lib/inngest/schemas/events.ts`)
- [ ] **Implement session ownership validation** in Inngest functions  
- [ ] **Add Inngest webhook signature verification** in `/api/inngest` route
- [ ] **Update tRPC procedures** to validate auth before queuing events
- [ ] **Add QUEUED status** to client polling states for real-time UI updates

### Database Changes
- [ ] **Create migration** to add `QUEUED` to PredictionSessionStatus enum
- [ ] **Update Prisma schema** if needed for new status

### Testing Strategy
#### Local Development
- [ ] **Run Inngest Dev Server** alongside Next.js dev
- [ ] **Test complete session flow** with polling UI
- [ ] **Verify credit handling** and refund logic

#### Staging Deployment  
- [ ] **Deploy with feature flag** to enable/disable new flow
- [ ] **Test with small batch** of users
- [ ] **Monitor error rates** and performance
- [ ] **Test unauthorized access scenarios** to verify security measures

#### Production Rollout
- [ ] **Gradual rollout** (10% � 50% � 100% of users)
- [ ] **Monitor session success rates** 
- [ ] **Compare performance** with old system

### Rollback Plan
- [ ] **Feature flag** to instantly revert to old system
- [ ] **Database cleanup** script for orphaned `QUEUED` sessions
- [ ] **Credit refund** script for failed migrations

---

## Configuration & Monitoring

### Inngest Configuration
- [ ] **Set retry policies** (3 attempts with exponential backoff)
- [ ] **Configure timeouts** (15 minutes max per function)
- [ ] **Set up rate limiting** to respect OpenRouter limits
- [ ] **Configure dead letter queue** for failed jobs

### Monitoring Setup
- [ ] **Inngest Dashboard** monitoring for job success/failure rates
- [ ] **Custom logging** to track migration performance
- [ ] **Alert setup** for high failure rates or timeout issues
- [ ] **Cost monitoring** to track Inngest usage vs free tier

### Manual Steps Required

#### Account Setup (You)
1. **Create Inngest account** at inngest.com
2. **Generate API keys** for dev/staging/production
3. **Add environment variables** to Vercel projects
4. **Set up webhook URLs** in Inngest dashboard

#### Production Deployment (You)
1. **Deploy Inngest webhook endpoint** (`/api/inngest`)
2. **Verify webhook connectivity** in Inngest dashboard
3. **Enable batch job migration** first
4. **Monitor and validate** before proceeding to Phase 2
5. **Gradually enable** real-time migration with feature flags

---

## Success Metrics

### Phase 1 (Foundation)
- [ ] **Inngest infrastructure** successfully deployed and synced
- [ ] **First cron job** (batch predictions) migrated successfully
- [ ] **Zero failed jobs** due to Vercel timeouts
- [ ] **BetterStack heartbeats** continue working

### Phase 2 (Complete Cron Takeover)
- [ ] **All 5 cron jobs** running on Inngest native scheduling
- [ ] **Zero Vercel cron dependencies** remaining in codebase
- [ ] **Entire `/api/cron/` directory** successfully removed
- [ ] **vercel.json cron config** completely eliminated
- [ ] **Unified job monitoring** in Inngest dashboard only

### Real-time Predictions (Phase 3)
- [ ] **<10 second** queue-to-processing time
- [ ] **Same or better** overall session completion rates
- [ ] **Improved user experience** with immediate queue feedback
- [ ] **No increase** in credit handling errors
- [ ] **No security vulnerabilities** from session ownership bypass
- [ ] **Event data contains no sensitive information** (audit logs)

---

## Estimated Timeline

**Phase 1 (Foundation + Initial): 1-2 weeks**
- Inngest setup & first migration: 1-2 days
- Development: 3-5 days  
- Testing & Deployment: 2-3 days

**Phase 2 (Complete Cron Takeover): 1-2 weeks**
- Convert 5 remaining cron jobs: 3-5 days
- Testing & validation: 3-4 days
- Remove all Vercel cron dependencies: 1-2 days
- Monitor stability: 2-3 days

**Phase 3 (Real-time Predictions): 2-3 weeks**
- Development: 1 week
- Testing: 3-5 days
- Gradual rollout: 3-5 days

**Total: 4-7 weeks** with complete Vercel cron elimination