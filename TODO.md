# Inngest Migration Plan

## Phase 1: Batch Jobs Migration (Lower Risk)

### Setup & Account Creation
- [ ] **Create Inngest Account** - Sign up at inngest.com with GitHub
- [ ] **Create Development App** - Generate dev/prod environment keys
- [ ] **Add Environment Variables** to Vercel:
  ```
  INNGEST_EVENT_KEY=evt_...
  INNGEST_SIGNING_KEY=signkey_...
  ```

### Code Changes - Batch Jobs

#### 1. Install Dependencies
```bash
pnpm add inngest
```

#### 2. Create Inngest Client
- [ ] **Create** `lib/inngest/client.ts`
  - Initialize Inngest client with environment keys
  - Export client for use across services

#### 3. Create Batch Prediction Function
- [ ] **Create** `lib/inngest/functions/batch-predictions.ts`
  - Convert `runBatchPredictionGeneration()` to Inngest function
  - Handle event: `batch.predictions.requested`
  - Implement step-by-step processing for each model
  - Add proper error handling and retries

#### 4. Create Inngest API Route
- [ ] **Create** `app/api/inngest/route.ts`
  - Inngest webhook handler for Vercel
  - Register batch prediction function
  - Handle Inngest HTTP requests

#### 5. Update Cron Endpoint
- [ ] **Modify** `app/api/cron/daily-generate-batch-predictions/route.ts`
  - Replace direct `runBatchPredictionGeneration()` call
  - Send Inngest event instead: `batch.predictions.requested`
  - Keep same validation and auth logic

#### 6. Testing & Validation
- [ ] **Test locally** with Inngest Dev Server (`npx inngest-cli dev`)
- [ ] **Deploy to staging** and verify webhook connectivity
- [ ] **Monitor** first production batch job execution
- [ ] **Validate** BetterStack heartbeat still works

### Rollback Plan
- [ ] Keep original batch function as fallback
- [ ] Feature flag to switch between old/new implementation

---

## Phase 2: Real-time Prediction Flow (Higher Risk)

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

#### Production Rollout
- [ ] **Gradual rollout** (10% ’ 50% ’ 100% of users)
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

### Batch Jobs (Phase 1)
- [ ] **Zero failed batch jobs** due to Vercel timeouts
- [ ] **Improved job visibility** in Inngest dashboard
- [ ] **Maintained or improved** processing times
- [ ] **BetterStack heartbeats** continue working

### Real-time Predictions (Phase 2)
- [ ] **<10 second** queue-to-processing time
- [ ] **Same or better** overall session completion rates
- [ ] **Improved user experience** with immediate queue feedback
- [ ] **No increase** in credit handling errors

---

## Estimated Timeline

**Phase 1 (Batch Jobs): 1-2 weeks**
- Setup: 1-2 days
- Development: 3-5 days  
- Testing & Deployment: 2-3 days

**Phase 2 (Real-time): 2-3 weeks**
- Development: 1 week
- Testing: 3-5 days
- Gradual rollout: 3-5 days

**Total: 3-5 weeks** with careful testing and monitoring