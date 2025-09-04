# Watchlist Feature Implementation Plan

## Executive Summary
The Watchlist feature enables users to bookmark markets and trigger batch AI predictions. This v1 focuses on core functionality with 70% of backend infrastructure already existing.

## V1 Scope (Simplified)
- ✅ Add/remove markets from watchlist (10 market limit)
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
    triggerPredictions: authenticatedProcedure.mutation()
  }
  ```

### 1.3 Zod Schemas (Minimal)
**File: `/lib/trpc/schemas/user.ts`**
- Create basic validation schemas:
  - `watchlistAddSchema` - Validate market ID, enforce 10 item limit
  - `watchlistRemoveSchema` - Market ID only
  - `checkSchema` - Check if market in watchlist

### 1.4 DTO Mappers
**File: `/lib/dtos/watchlist-mapper.ts`**
- Create DTOs for watchlist items with market data
- Include AI delta calculations
- Map prediction session status
- Include email preferences

### 1.5 Service Layer
**File: `/lib/services/user-service.ts`**
- Most methods already exist! Only add:
  - `checkWatchlistLimit()` - Enforce 10 market limit
  - Reuse existing `getUserWatchlist()`, `addToWatchlist()`, `removeFromWatchlist()`
  - Reuse credit checks from prediction flow

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
**Based on research:**
- Free tier: 50-1000 requests/day (based on credits purchased)
- Paid accounts: Significantly higher limits (3x increase recently)
- Strategy: Use conservative concurrency limit of 2 to avoid issues

### 2.2 Simple Batch Prediction Workflow
**File: `/lib/inngest/functions/watchlist-predictions.ts`**
```typescript
export const processWatchlistPredictions = inngest.createFunction({
  id: "watchlist-predictions",
  name: "Process Watchlist Predictions",
  concurrency: { limit: 2 }, // Conservative for OpenRouter
  retries: 3, // Use Inngest's built-in retry
  // Step 1: Get user's watchlist markets
  // Step 2: Check credit balance
  // Step 3: Generate predictions sequentially
  // Step 4: Send simple text email when complete
})
```

### 2.3 Scheduled Workflows (V2 - Not in initial release)
- Daily/weekly cron jobs moved to v2
- Focus on manual trigger only for v1
- Reduces complexity and testing requirements

### 2.4 Simple Email Notification
**File: `/lib/services/watchlist-email-service.ts`**
- One simple text email template:
  ```
  Your watchlist predictions are complete!
  
  [List of markets with results]
  
  View details at: https://betterai.tools/watchlist
  ```
- Use existing Loops.so integration
- HTML templates moved to v2

### 2.4 Workflow Registry
**File: `/lib/inngest/functions.ts`**
- Register new watchlist workflows
- Add to function export array

### 2.5 Testing
**File: `/lib/inngest/__tests__/watchlist-workflows.test.ts`**
- Test workflow step functions
- Mock email service calls
- Verify error handling and retries

**Deliverables:**
- ✅ On-demand prediction workflow
- ✅ Daily automated workflow
- ✅ Email notification system
- ✅ Workflow monitoring setup

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
- Toast warning "Watchlist limited to 10 markets during beta" when limit reached
- Reuse existing DS tokens from `/lib/design-system.ts`
- Reuse credit insufficiency warning from predict flow

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
- "Trigger Watchlist Predictions Now" button only
- Button disabled state during processing
- Show toast "Batch predictions initiated. You'll receive an email when complete."
- Simple text: "Generate AI predictions for all markets in your watchlist"

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

### 4.2 Email Templates
**File: `/lib/email-templates/watchlist-recap.tsx`**
- Design HTML email templates
- Include market metrics and AI deltas
- Mobile-responsive email design
- Test with real email delivery

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

**Deliverables:**
- ✅ Fully integrated watchlist feature
- ✅ Production-ready email notifications
- ✅ Performance optimized
- ✅ Complete test coverage
- ✅ Documentation

---

## Implementation Timeline (Simplified)

### Total: 5-7 days
- **Day 1**: Phase 1 - Backend API setup
- **Day 2**: Phase 2 - Inngest workflow
- **Days 3-4**: Phase 3 - Frontend UI
- **Day 5**: Phase 4 - Integration & manual testing
- **Day 6**: Buffer for fixes and deployment

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
- **Watchlist Limit**: 10 markets during beta (enforced in service layer)
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

## Error Recovery Strategy

### Failed Prediction Handling (Simplest Approach)
**Strategy: Inngest Built-in Recovery**
```typescript
// Use Inngest's automatic retry with exponential backoff
export const processWatchlistPredictions = inngest.createFunction({
  retries: 3,
  onFailure: async ({ error, event, step }) => {
    // Log to BetterStack
    await step.run("log-failure", async () => {
      structuredLogger.error("Watchlist prediction failed", {
        userId: event.data.userId,
        error: error.message,
        attempt: event.attempt
      });
    });
    
    // Send failure notification email (optional)
    if (event.attempt === 3) {
      await step.run("notify-user", async () => {
        // Send "predictions temporarily unavailable" email
      });
    }
  }
})
```

**Benefits of this approach:**
- ✅ No custom retry logic needed
- ✅ Automatic exponential backoff
- ✅ Built-in dead letter queue
- ✅ Visibility in Inngest dashboard
- ✅ Integrated with existing monitoring

## Potential Issues & Mitigation

### 1. **Credit Cost Calculation Complexity**
- **Issue**: Variable model costs and user credit balances
- **Mitigation**: Reuse credit check from predict flow, show same warnings

### 2. **Email Deliverability**
- **Issue**: Emails might go to spam
- **Mitigation**: Use Loops.so best practices, authenticate domain

### 3. **Large Watchlist Performance**
- **Issue**: Users with 100+ markets could slow queries
- **Mitigation**: 10 market beta limit solves this initially

### 4. **Concurrent Prediction Limits**
- **Issue**: OpenRouter API rate limits
- **Mitigation**: Queue with Inngest concurrency limits (5 concurrent)

### 5. **User Notification Preferences**
- **Issue**: Users may want granular email controls
- **Mitigation**: Basic on/off + frequency in v1, granular in v2

---

## Future Enhancements (v2)

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
- ✅ Add/remove markets to watchlist (10 limit)
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
1. **No database migrations needed** - Existing schema works for v1
2. **Minimal API endpoints** - Just 5 tRPC procedures
3. **Manual testing only** - No automated tests initially
4. **Simple text emails** - No HTML templates
5. **Conservative rate limits** - Concurrency of 2 for OpenRouter
6. **No scheduled jobs** - Manual trigger only

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