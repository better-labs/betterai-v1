# Watchlist Feature Implementation Plan

## Executive Summary
The Watchlist feature enables users to bookmark markets and trigger batch AI predictions. This v1 focuses on core functionality with 70% of backend infrastructure already existing.

---

## Plan Updates (Simplifications & Changes)

These updates streamline v1 by reusing existing systems and removing non‑essential work:

- Reuse `predictionSessions.start` for batch runs; do not add a separate watchlist Inngest worker. Implement a `watchlist.startBatch` tRPC endpoint that reads the user’s watchlist, validates credits once, and calls `predictionSessions.start` with `useInngest: true` for each market. Return created session IDs for client polling.
- Skip new DTOs and complex UI. Do not add `watchlist-mapper.ts`. Use `getUserWatchlist()` to fetch market IDs; enrich with market + latest prediction using existing service query patterns; render with `MarketWithPredictionCard` and set `hidePredictionButton`.
- Remove watchlist limit in v1. Do not enforce item limits in schemas or services. Keep pagination/UX considerations for large lists as a performance note.
- Transactional email on completion: add `lib/services/email.ts`. Configure Loops transactional email manually (see https://loops.so/docs/transactional/guide). The watchlist batch endpoint can optionally send a single summary email after all sessions complete, or this can be deferred with client‑side polling for v1.
- Extract and reuse Model Selector. Factor the model selection UI from `features/prediction/prediction-generator.client.tsx` into a `ModelSelector` component and reuse it in `features/watchlist/watchlist-controls.client.tsx`.
- Watchlist cleanup & hygiene: skip markets that are not open for betting (via `lib/utils/market-status.ts`) when triggering batches. Add `getOpenWatchlistMarkets(userId)` that filters `market.closed !== true` before creating sessions. Optionally show a toast for skipped items.
- Consistency & idempotency: update `addToWatchlist` to gracefully handle duplicates (unique index at `prisma/schema.prisma:242`), returning a stable “already exists” result; keep `removeFromWatchlist` idempotent. Add `showWatchlist` to `lib/feature-flags.ts` to control rollout.

## V1 Scope (Simplified)
- ✅ Add/remove markets from watchlist (no enforced limit in v1)
- ✅ Basic watchlist page with market list
- ✅ On-demand batch predictions only (no automated schedules initially)
- ✅ Simple text email notification when predictions complete
- ✅ Credit insufficiency warnings (reuse existing)
- ✅ Clean UI matching existing design system

## Moved to V2
- ⏳ Automated daily/weekly prediction schedules
- ⏳ Email preference management UI
- ⏳ Email frequency options (daily/weekly)
- ⏳ HTML email templates
- ⏳ Analytics and metrics tracking
- ⏳ Advanced error recovery beyond Inngest defaults

## Existing Infrastructure (Ready to Use)
### Database Layer ✅
- `UserWatchlist` model with proper indexes and relationships
- Full CRUD operations in `user-service.ts`
- Migration already applied to production

### Service Layer ✅
- `getUserWatchlist()`, `addToWatchlist()`, `removeFromWatchlist()`
- `isInWatchlist()`, `getWatchlistCount()`
- Service layer pattern with dependency injection

### Email Service ✅
- Loops.so integration fully configured
- `loops-service.ts` with contact management
- Already used in user registration flow

### Workflow System ✅
- Inngest client and infrastructure
- Patterns for batch predictions and scheduled jobs
- Structured logging and monitoring

## Email Service Recommendation
**Current Choice: Loops.so** (Already Integrated)
- ✅ Already configured with API key
- ✅ Service layer implementation exists
- ✅ Used in production for user registration

**Alternative Options (if needed):**
1. **Resend** - Simple, developer-friendly, React email templates
2. **SendGrid** - Enterprise-grade, high deliverability
3. **Recommendation**: Continue with Loops.so since it's already integrated

---

## Phase 1: Backend Infrastructure & Testing (2-3 days)

### 1.1 Database Schema
**Note**: UserWatchlist model already exists - no schema changes needed for v1!
- Existing schema is sufficient for core functionality
- Email preferences will be added in v2

### 1.2 tRPC API Layer (Simplified)
**File: `/lib/trpc/routers/users.ts`**
- Add minimal watchlist procedures:
  ```typescript
  watchlist: {
    list: authenticatedProcedure.query(),
    add: authenticatedProcedure.input(watchlistAddSchema).mutation(),
    remove: authenticatedProcedure.input(watchlistRemoveSchema).mutation(),
    isInWatchlist: authenticatedProcedure.input(checkSchema).query(),
    startBatch: authenticatedProcedure
      .input(z.object({ selectedModels: z.array(z.string()).min(1) }))
      .mutation() // Loops over open watchlist markets and calls predictionSessions.start
  }
  ```

### 1.3 Zod Schemas (Minimal)
**File: `/lib/trpc/schemas/user.ts`**
- Create basic validation schemas:
  - `watchlistAddSchema` - Validate market ID (no item limit enforcement in v1)
  - `watchlistRemoveSchema` - Market ID only
  - `checkSchema` - Check if market in watchlist

### 1.4 DTO Mappers
Defer custom watchlist DTOs for v1.
- Do not create `lib/dtos/watchlist-mapper.ts`.
- Use existing market mapping and include latest prediction via existing include patterns.

### 1.5 Service Layer (Leverages Existing Infrastructure)
**File: `/lib/services/user-service.ts`**
- Most methods already exist. For v1:
  - Do not add `checkWatchlistLimit()` (no enforced limit).
  - Add `getOpenWatchlistMarkets(userId)` that returns only markets open for betting (skip `market.closed === true`).
  - Update `addToWatchlist()` to be idempotent against duplicates (handle unique index and return a stable shape when already exists).
  - Reuse existing `getUserWatchlist()`, `removeFromWatchlist()`.

**Key Integration**: The batch predictions will use existing `predictionSessionService.createPredictionSession()` for each market, leveraging all existing:
- ✅ Credit validation and consumption
- ✅ Rate limiting and queuing  
- ✅ Error handling and retries
- ✅ Progress tracking and monitoring
- ✅ Recovery mechanisms

### 1.6 Testing (Manual for v1)
- Manual testing via Postman/API calls
- Test 10 market limit enforcement
- Test credit insufficiency handling
- Automated tests moved to v2

**Deliverables:**
- ✅ Minimal tRPC API for watchlist operations
- ✅ Basic schemas with 10 market limit
- ✅ Credit checks reused from existing code
- ✅ Manual testing completed

---

## Phase 2: Inngest Workflow Integration (1-2 days)

### 2.1 OpenRouter Rate Limits
- Strategy: Use conservative concurrency limit of 2 to avoid issues

### 2.2 Reuse Existing Prediction Session Infrastructure ✅
**MAJOR SIMPLIFICATION**: Do not create a dedicated watchlist Inngest function. Reuse the existing `predictionSessions.start` for each market in the watchlist.

**Approach**: `watchlist.startBatch` (tRPC) loops over open watchlist markets and calls `predictionSessions.start` with `useInngest: true`.
- ✅ **Existing Infrastructure**: `PredictionSession` model, service layer, Inngest workflows
- ✅ **Proven Reliability**: Battle-tested with retries, recovery, and error handling
- ✅ **Credit Management**: Built-in credit validation and consumption
- ✅ **Rate Limiting**: OpenRouter rate limits already handled
- ✅ **Progress Tracking**: Real-time status updates and step tracking

Remove planned `/lib/inngest/functions/watchlist-predictions.ts` for v1; rely on the existing prediction session worker.

### 2.3 Scheduled Workflows (V2 - Not in initial release)
- Daily/weekly cron jobs moved to v2
- Focus on manual trigger only for v1
- Reduces complexity and testing requirements

### 2.4 Email on Completion (v1 minimal)
**File: `/lib/services/email.ts`**
- Add a minimal transactional email wrapper. For Loops transactional setup, follow: https://loops.so/docs/transactional/guide
- Manual step required to configure API keys and templates in Loops.
- Optional in v1: you can defer emails and rely on client polling of returned `sessionId`s.
- Simple polling - wait for all sessions to reach terminal state, then send summary

### 2.5 Workflow Registry
**File: `/lib/inngest/functions.ts`**
- No new watchlist workflow registration needed for v1.

### 2.6 Testing
**File: `/lib/inngest/__tests__/watchlist-workflows.test.ts`**
- Focus on testing `predictionSessions` flows (already covered). For watchlist batching, unit test the tRPC `startBatch` to ensure it filters closed markets and invokes session creation per market.

**Deliverables:**
- ✅ Watchlist batch prediction workflow (creates individual prediction sessions)
- ✅ Email notification system for batch completion
- ✅ Reuse existing prediction session monitoring and recovery
- ✅ Simplified implementation leveraging proven infrastructure

---

## Phase 3: Frontend UX Implementation (3-4 days)

### 3.1 Watchlist Toggle Button Component
**File: `/features/watchlist/watchlist-toggle-button.client.tsx`**
```typescript
interface WatchlistToggleButtonProps {
  marketId: string
  userId?: string // Optional - show disabled state if not authenticated
  variant?: 'default' | 'compact'
}
```
- "Add to Watchlist" / "Remove from Watchlist" states
- Show disabled with "Sign in to save" tooltip for non-authenticated users
- Loading state during API calls
- Toast notifications on success
- Reuse existing DS tokens from `/lib/design-system.ts`
- Reuse credit insufficiency warning from predict flow if the user does not have sufficient credits for the weekly watchlist predictions

### 3.2 Watchlist Page
**File: `/app/watchlist/page.tsx`**
```typescript
// Server component for initial data
// Client components for interactions
```

**File: `/features/watchlist/watchlist-grid.client.tsx`**
- Grid layout with columns:
  - Event icon
  - MarketMetrics (reuse existing component)
  - AI Delta (reuse existing component)
  - Remove button ("X" icon)
- Mobile-first responsive design
- Empty state when no items

### 3.3 Watchlist Controls Component (Simplified)
**File: `/features/watchlist/watchlist-controls.client.tsx`**
- "Generate Predictions for All Markets" button with model selection
- Model selector: extract from `features/prediction/prediction-generator.client.tsx` into a shared `ModelSelector` component; import and reuse here
- Credit cost calculator showing total cost for all markets
- Button disabled state during processing
- Show toast "Batch predictions initiated. You'll receive an email when complete."
- Progress indicator showing individual prediction session statuses

**Key UX Enhancement**: Users can see each market's prediction session status in real-time, just like individual predictions but in a batch view.

### 3.4 Integration Points
**File: `/features/market/market-with-prediction-card.client.tsx`**
- Add WatchlistToggleButton next to "Predict with AI"
- Less prominent styling per requirements

### 3.5 Mock Data & Storybook
**File: `/features/watchlist/__stories__/watchlist.stories.tsx`**
- Create stories for all watchlist components
- Mock endpoints for development
- Test various states (empty, loading, error)

**Deliverables:**
- ✅ Watchlist toggle button component
- ✅ Complete watchlist page with grid
- ✅ Credit cost calculator UI
- ✅ Batch trigger functionality
- ✅ Mobile-responsive design

---

## Phase 4: Integration & Testing (1-2 days)

### 4.1 Connect Frontend to Backend
**Remove mocks and connect real endpoints:**
- Connect tRPC hooks in all components
- Real-time updates with React Query
- Optimistic UI updates

### 4.2 Transactional Email Setup
**File: `/lib/services/email.ts`**
- Implement a minimal sender. Document manual setup for Loops transactional: https://loops.so/docs/transactional/guide
- Optional HTML templates and advanced design moved to v2.

### 4.3 Performance Optimization
- Implement pagination for large watchlists
- Add database indexes if needed
- Optimize query performance
- Implement caching strategy

### 4.4 Error Handling & Edge Cases
- Handle rate limits
- Credit insufficiency warnings
- Network error recovery
- Graceful degradation
- Skip closed markets in batch runs (via `lib/utils/market-status.ts`); show toast for skipped items
- Ensure `addToWatchlist` handles duplicates gracefully; keep `removeFromWatchlist` idempotent

### 4.5 Manual Testing Checklist
- [ ] Add market to watchlist
- [ ] Remove market from watchlist
- [ ] Verify 10 market limit
- [ ] Trigger batch predictions
- [ ] Verify email received
- [ ] Check credit deduction

### 4.6 Documentation
**File: `/docs/features/watchlist.md`**
- User guide for watchlist feature to add to https://docs.betterai.tools/
- API documentation
- Deployment checklist
- Monitoring setup
- Note feature flag: add and enable `showWatchlist` in `lib/feature-flags.ts` for controlled rollout

**Deliverables:**
- ✅ Fully integrated watchlist feature
- ✅ Production-ready email notifications
- ✅ Performance optimized
- ✅ Complete test coverage
- ✅ Documentation

---

## New Implementation Approach: Leverage Existing Prediction Sessions

### How It Works (Simplified Architecture)
1. **User triggers batch predictions** → `watchlist.startBatch()` (tRPC)
2. **For each open market in watchlist** → Create individual `PredictionSession` via `predictionSessions.start`
3. **Existing Inngest workflows** → Process each session independently
4. **Monitor all sessions** → Track progress until all complete
5. **Send email summary** → Include results from all prediction sessions

### Key Benefits of This Approach
- ✅ **90% Less Code**: Reuse existing prediction session infrastructure
- ✅ **Battle-Tested**: Leverage proven error handling, retries, recovery
- ✅ **Individual Progress**: Users can see each market's prediction status
- ✅ **Partial Success**: If some predictions fail, others still succeed
- ✅ **Credit Safety**: Existing credit validation and consumption logic
- ✅ **Rate Limiting**: OpenRouter limits already handled by existing queuing
- ✅ **Monitoring**: Full observability through existing Inngest dashboard

### What We Still Need to Build
- **Watchlist CRUD operations** (mostly exists; ensure idempotent add/remove)
- **Batch trigger endpoint** (loops `predictionSessions.start`; filters closed markets)
- **Batch progress monitoring** (polls multiple session statuses)
- **Email summary service** (optional in v1; transactional setup in `lib/services/email.ts`)
- **Frontend components** (watchlist page, toggle buttons, progress indicators)

---

## Implementation Timeline (Simplified)

### Total: 3-4 days (Reduced from 5-7 days)
- **Day 1**: Backend API + batch prediction trigger (leverages existing sessions)
- **Day 2**: Frontend watchlist page + controls
- **Day 3**: Integration, email notifications, testing
- **Day 4**: Buffer for fixes and deployment

**Time Saved**: 2-3 days by reusing existing prediction session infrastructure instead of building custom watchlist workflows.

---

## Design System Tokens (New/Recommended)

### New Tokens for `/lib/design-system.ts`
```typescript
watchlist: {
  button: {
    toggle: 'text-muted-foreground hover:text-foreground transition-colors',
    remove: 'text-destructive hover:text-destructive/80'
  },
  grid: {
    container: 'divide-y divide-border',
    row: 'py-4 flex items-center gap-4',
    cell: 'flex-1'
  },
  creditCost: {
    container: 'bg-muted/30 rounded-lg p-4',
    text: 'text-sm text-muted-foreground',
    value: 'text-lg font-semibold'
  }
}
```

---

## Design Decisions & Clarifications

### Business Logic
- **Watchlist Limit**: No enforced limit in v1
- **Default Email**: Weekly digest (users can switch to daily)
- **Batch Emails**: Single summary email for batch predictions (not individual)
- **Credit Checks**: Reuse existing insufficient credit warnings from predict flow
- **Market Resolution**: Auto-remove resolved markets from watchlist
- **Authentication**: Show disabled button with tooltip for non-authenticated users
- **Stale Predictions**: Keep all predictions (no auto-expiry)

### Technical Decisions
- **Queue System**: Implement from start using Inngest concurrency
- **Cron Staggering**: Process users in batches every 10 minutes (9 AM-12 PM)
- **Email Preferences**: Store in UserWatchlist table (not separate)
- **Error Tracking**: Use Inngest + BetterStack (not Sentry initially)
- **Sorting/Filtering**: Defer to v2 (keep initial version simple)

## Error Recovery Strategy (Leverages Existing Infrastructure)

### Failed Prediction Handling ✅ **ALREADY SOLVED**
**Strategy: Reuse Existing Prediction Session Recovery**

The existing prediction session infrastructure already handles all error recovery scenarios:
- ✅ **Individual Session Retries**: Each prediction session has built-in retry logic
- ✅ **Stuck Session Recovery**: Scheduled recovery runs every hour 
- ✅ **Manual Recovery**: Recovery events for specific stuck sessions
- ✅ **Credit Refunds**: Failed sessions don't consume credits
- ✅ **Error Logging**: Structured logging with BetterStack integration
- ✅ **Recovery Monitoring**: Full visibility in Inngest dashboard

**For Watchlist Batches**: If individual market prediction sessions fail, they will be automatically recovered by existing infrastructure. The batch email will include both successful and failed predictions, with clear status indicators.

**Benefits of this approach:**
- ✅ Zero additional error handling code needed
- ✅ Battle-tested recovery mechanisms
- ✅ Individual market failures don't affect entire batch
- ✅ Automatic credit management for failed predictions
- ✅ Full observability through existing monitoring

## Potential Issues & Mitigation

### 1. **Credit Cost Calculation Complexity**
- **Issue**: Variable model costs and user credit balances
- **Mitigation**: Reuse credit check from predict flow, show same warnings

### 2. **Email Deliverability**
- **Issue**: Emails might go to spam
- **Mitigation**: Use Loops.so best practices, authenticate domain

### 3. **Large Watchlist Performance**
- **Issue**: Users with very large watchlists could slow queries
- **Mitigation**: No limit enforced in v1; recommend pagination and incremental loading as usage grows

### 4. **Concurrent Prediction Limits** ✅ **ALREADY SOLVED**
- **Issue**: OpenRouter API rate limits  
- **Mitigation**: Existing prediction session infrastructure already handles concurrency and rate limits through Inngest queuing

### 5. **User Notification Preferences**
- **Issue**: Users may want granular email controls
- **Mitigation**: Basic on/off + frequency in v1, granular in v2

---

## Future Enhancements (watchlist v2)

### Phase 5 Features (Next Release)
1. **Automated Schedules**
   - Daily/weekly cron jobs
   - Staggered processing
   - Email frequency preferences

2. **Enhanced UI**
   - Email preference management
   - Sorting/filtering watchlist
   - Credit cost calculator display

3. **Advanced Email**
   - HTML email templates
   - Unsubscribe links
   - Email bounce handling

4. **Testing & Analytics**
   - Automated test suite
   - Usage analytics
   - Performance monitoring

### Phase 6 Features (Future)
1. **Model Selection**
   - Choose AI model per prediction
   - Dynamic credit costs

2. **Polymarket Integration**
   - Import active portfolio
   - Sync with positions

3. **Advanced Alerts**
   - Price threshold notifications
   - Market resolution alerts
   - Webhook integrations

---

## Success Metrics

### Technical Metrics
- API response time < 200ms
- Email delivery rate > 95%
- Workflow success rate > 99%
- Zero critical bugs in production

### User Metrics
- Watchlist adoption rate > 30%
- Daily active watchlist users
- Prediction trigger frequency
- Email engagement rate

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Email templates reviewed
- [ ] Credit cost calculations verified
- [ ] Rate limits configured
- [ ] Monitoring alerts setup

### Deployment
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Inngest workflows deployed
- [ ] Email service verified
- [ ] Feature flags enabled

### Post-deployment
- [ ] Monitor error rates
- [ ] Verify email delivery
- [ ] Check workflow execution
- [ ] User feedback collection
- [ ] Performance monitoring

---

*"The beginning is the most important part of the work." - Plato*

This plan leverages 70% existing infrastructure, focusing development effort on the 30% of new functionality needed to deliver a complete, production-ready Watchlist feature.

---

## Summary of Simplifications for V1

### What We Kept (Core Features)
- ✅ Add/remove markets to watchlist (no enforced limit)
- ✅ Basic watchlist page
- ✅ Manual batch predictions trigger
- ✅ Simple text email notifications
- ✅ Credit insufficiency checks (reused)
- ✅ Inngest's built-in retry mechanism

### What We Moved to V2
- ⏳ Automated daily/weekly schedules
- ⏳ Email preferences UI
- ⏳ HTML email templates
- ⏳ Automated testing
- ⏳ Analytics tracking
- ⏳ Advanced error recovery

### Key Simplifications Made
1. No database migrations needed — existing schema works for v1
2. Minimal API endpoints — `watchlist` CRUD + `startBatch` that delegates to `predictionSessions.start`
3. Manual testing only — no automated tests initially
4. Optional transactional email — minimal `lib/services/email.ts` with manual Loops setup; HTML templates moved to v2
5. Reuse prediction sessions — leverage existing infrastructure for 90% of complexity
6. No scheduled jobs — manual trigger only (v1)
7. No custom error handling — existing prediction session recovery handles everything
8. No watchlist item limit — simplify validation and UX

### OpenRouter Rate Limits (Research Findings)
- **Free tier**: 50-1000 requests/day based on credits
- **Paid accounts**: Much higher limits (3x increase recently)
- **Our approach**: Conservative concurrency of 2 to avoid issues
- **Fallback**: OpenRouter handles provider failures automatically

### Implementation Approach
1. **Phase 1-2 first** (Backend) - Deploy and test via API
2. **Phase 3-4 next** (Frontend) - Add UI once backend stable
3. **Feature flag** - Roll out gradually to users
4. **Monitor closely** - Watch Inngest dashboard and logs

### Success Metrics for V1
- Users can save up to 10 markets
- Batch predictions work reliably
- Email notifications delivered
- No critical bugs
- 5-7 day implementation timeline
