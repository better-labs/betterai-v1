# User Prediction System Implementation Plan

## Epic Overview
Implement comprehensive "Predict with AI" capability allowing users to create/redo predictions on markets with a credits-based system supporting multiple AI providers.

## Current State Analysis

### Database Schema
✅ User table exists but needs credits fields
✅ Prediction table already supports user-generated predictions  
✅ Good foundation for user-linked predictions

### Existing Services
✅ `generate-single-prediction.ts` handles prediction generation
✅ OpenRouter client supports multiple models
✅ Authentication system integrated with Privy
✅ Rate limiting implemented

### UI Components  
⚠️ Credits page exists but mocked up
⚠️ Activity page exists but shows mock data
❌ Prediction builder page doesn't exist
❌ Prediction results/streaming page doesn't exist

## Part 1: Credits System Implementation

### Database Schema Changes

**Recommendation**: Store credits directly in User table for simplicity (solo founder approach).

```sql
-- Migration: Add credits fields to users table
ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN credits_last_reset TIMESTAMP(6) DEFAULT NOW();
ALTER TABLE users ADD COLUMN total_credits_earned INTEGER NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN total_credits_spent INTEGER NOT NULL DEFAULT 0;

-- Index for efficient credit queries
CREATE INDEX idx_users_credits ON users(credits);
CREATE INDEX idx_users_credits_reset ON users(credits_last_reset);
```

### Credit Management Service

**File**: `lib/services/credit-manager.ts`

```typescript
interface CreditTransaction {
  userId: string
  amount: number  // positive = earned, negative = spent
  reason: string  // "daily_reset", "prediction_generated", "signup_bonus"
  marketId?: string
  predictionId?: number
}

class CreditManager {
  async getUserCredits(userId: string): Promise<number>
  async consumeCredits(userId: string, amount: number, reason: string, metadata?: object): Promise<boolean>
  async addCredits(userId: string, amount: number, reason: string): Promise<void>
  async resetDailyCredits(userId: string): Promise<void>
  async shouldShowAddCreditsButton(userId: string): Promise<boolean> // < 10 credits
}
```

### Credit Rules
- **New user signup**: 100 free credits
- **Daily reset**: Reset to minimum 100 credits daily (not cumulative)
- **Consumption**: 1 credit per AI model selected
- **Low credit warning**: Show "Add Credits" button when < 10 credits
- **Credit persistence**: Track total earned/spent for analytics

### API Endpoints

**New Routes**:
- `GET /api/user/credits` - Get current credit balance
- `POST /api/user/credits/consume` - Consume credits (internal)
- `POST /api/user/credits/reset` - Manual reset (admin/cron)

### UI Updates

**Credits Page** (`app/credits/page.tsx`):
- Replace mock with real credit balance
- Show credit history/usage
- Display daily reset time
- Add credits purchase flow (future)
- Hide "Add Credits" button if credits >= 10

**Navigation Updates**:
- Add credit balance to header/nav
- Show low credit warning indicator

## Part 2: Prediction Builder Implementation

### New Pages & Components

**Prediction Builder Page** (`app/predict/[marketId]/page.tsx`):
- Market information display
- AI model provider selection (multi-select)
- Credit cost calculator
- "Generate Prediction" action button
- Authentication guard

**Model Provider Selection Component**:
```typescript
interface ModelProvider {
  id: string           // 'google/gemini-2.5-pro'
  name: string         // 'Google Gemini'
  description: string
  costCredits: number  // Always 1 for now
}

const SUPPORTED_MODELS: ModelProvider[] = [
  { id: 'google/gemini-2.5-pro', name: 'Google Gemini', description: 'Advanced reasoning', costCredits: 1 },
  { id: 'openai/gpt-5', name: 'OpenAI GPT-5', description: 'Latest OpenAI model', costCredits: 1 },
  { id: 'anthropic/claude-sonnet-4', name: 'Anthropic Claude', description: 'Thoughtful analysis', costCredits: 1 },
  { id: 'x-ai/grok-4', name: 'xAI Grok', description: 'Real-time aware', costCredits: 1 },
  { id: 'qwen3-235b-a22b-instruct-2507', name: 'Alibaba Qwen', description: 'Multilingual capability', costCredits: 1 }
]
```

**Prediction Results Page** (`app/predict/[marketId]/results/[sessionId]/page.tsx`):
- Real-time progress tracking via SSE
- Multiple prediction results display
- Shareable links to predictions
- "Update Prediction" capability

### Real-time Progress Implementation

**Technology Choice**: Server-Sent Events (SSE) for simplicity
- More straightforward than WebSockets for one-way communication
- Built-in browser reconnection
- Easier to implement for solo founder

**SSE Endpoint** (`app/api/predict/stream/[sessionId]/route.ts`):
```typescript
// Progress states:
// 1. "initializing" - Setting up prediction session
// 2. "researching" - Gathering web research data  
// 3. "predicting_[modelName]" - Sending to specific AI model
// 4. "processing_[modelName]" - Preparing results for model
// 5. "completed_[modelName]" - Model prediction completed
// 6. "finished" - All predictions complete
```

**Prediction Session Management**:
- Generate unique sessionId for each prediction request
- Store session state in-memory (Redis future enhancement)
- Track progress per model selected
- Handle failures gracefully with partial results

### New Services

**User Prediction Service** (`lib/services/generate-user-prediction.ts`):
- Extends `generate-single-prediction.ts`
- Supports multiple models simultaneously
- Integrates with credit system
- Adds `:online` flag for web search
- Progress tracking and session management

```typescript
interface UserPredictionRequest {
  marketId: string
  userId: string
  selectedModels: string[]
  sessionId: string
}

interface PredictionProgress {
  sessionId: string
  status: 'initializing' | 'researching' | 'predicting' | 'completed' | 'error'
  currentStep?: string
  completedModels: string[]
  totalModels: number
  results: Map<string, PredictionResult>
  error?: string
}
```

## Part 3: UI/UX Enhancements

### Market Page Updates (`app/market/[marketId]/page.tsx`)

**Replace "Make a Prediction" button**:
- Change link from `"/"` to `"/predict/${marketId}"`
- Update button text to "Predict with AI"
- Add authentication check
- Show credit requirement (e.g., "1-5 credits")

**Add "Update Prediction" Button**:
- Show when existing prediction exists
- Link to prediction builder with "update" mode
- Indicate credit cost for re-prediction

### Activity Page Updates (`app/activity/page.tsx`)

**Replace mock data with real user predictions**:
- Query user's predictions from database
- Show prediction status (completed, processing, failed)
- Display credit costs and model used
- Link to individual prediction results
- Add filtering/sorting capabilities

**New API Endpoint**: `GET /api/user/predictions`

### Loading States & Animations

**Prediction Progress Components**:
- Animated progress bars for each model
- Status indicators with icons
- Estimated time remaining
- Smooth transitions between states

**Skeleton Loading**:
- Market information loading states
- Prediction builder form loading
- Results page loading states

## Part 4: Technical Implementation Details

### API Route Changes

**Enhanced Predict Endpoint** (`app/api/predict/route.ts`):
- Support multiple model selection
- Credit consumption integration
- Session-based prediction tracking
- Progress updates via SSE

**New Prediction Endpoints**:
- `POST /api/predict/multi` - Multi-model prediction request
- `GET /api/predict/session/[sessionId]` - Get prediction session status
- `GET /api/predict/stream/[sessionId]` - SSE progress stream

### Database Migration Strategy

```sql
-- Phase 1: Add credits to users table
-- Phase 2: Add session tracking table (optional)
CREATE TABLE prediction_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  market_id VARCHAR(255) NOT NULL,
  selected_models TEXT[] NOT NULL,
  status VARCHAR(50) NOT NULL,
  progress JSONB,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  completed_at TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (market_id) REFERENCES markets(id)
);
```

### Error Handling & Resilience

**Partial Failure Handling**:
- If some models fail, show successful predictions
- Clear error messages for failed models
- Option to retry failed models
- Credit refund for failed predictions

**Rate Limiting Updates**:
- Per-user prediction limits (10/hour, 50/day)
- Per-model rate limiting
- Queue management for high demand periods

## Part 5: Security & Legal Considerations

### Legal Requirements

**Terms of Service Updates**:
- Clarify AI prediction disclaimers
- Credit system terms and conditions
- Data usage and model training policies
- Refund/credit policy for failed predictions

**Content Security**:
- Input sanitization for user messages
- Rate limiting per user and IP
- Abuse detection for credit farming
- Model output filtering if needed

### Security Measures

**Credit Security**:
- Server-side credit validation
- Transaction logging for audit trail
- Prevent credit manipulation
- Daily reset automation with cron

**API Security**:
- Authentication required for all prediction endpoints
- Rate limiting per authenticated user
- Input validation and sanitization
- Error message security (no internal details)

## Part 6: Implementation Timeline & Priorities

### Phase 1: Foundation (Week 1)
1. Database migration for credits system
2. Credit manager service implementation
3. Credits page real data integration
4. Basic multi-model service structure

### Phase 2: Core Prediction Flow (Week 2)
1. Prediction builder page implementation
2. Multi-model prediction service
3. Basic SSE progress tracking
4. Credit consumption integration

### Phase 3: Results & Polish (Week 3)
1. Prediction results page with streaming
2. Activity page real data integration
3. Market page "Predict" button updates
4. Error handling and edge cases

### Phase 4: Enhancement & Testing (Week 4)
1. Loading states and animations
2. Comprehensive testing
3. Performance optimization
4. Legal/ToS updates

## Part 7: Monitoring & Analytics

### Key Metrics to Track
- Credit consumption per user
- Prediction success/failure rates by model
- User engagement with prediction builder
- Model performance comparison
- Revenue potential (future paid credits)

### Logging Requirements
- Credit transactions with full audit trail
- Prediction session lifecycle
- Model API call success/failure rates
- User behavior analytics (page views, conversion)

## Part 8: Future Considerations

### Scalability Improvements
- Redis for session management
- Database connection pooling
- CDN for static assets
- Background job processing

### Feature Enhancements
- Model comparison dashboard
- Prediction accuracy tracking
- Social sharing of predictions
- User prediction leaderboards
- Premium model access

### Monetization Readiness
- Paid credit packages
- Premium model access
- API access for power users
- White-label prediction services

## Risk Mitigation

### Technical Risks
- **Model API failures**: Implement fallback models and graceful degradation
- **Rate limiting**: Queue management and user communication
- **SSE connection issues**: Implement reconnection and fallback polling

### Business Risks  
- **Credit abuse**: Implement fraud detection and daily limits
- **Legal compliance**: Regular ToS reviews and disclaimer updates
- **User experience**: Extensive testing of the prediction flow

### Operational Risks
- **Solo founder complexity**: Prioritize simple, maintainable solutions
- **Third-party dependencies**: Monitor OpenRouter API reliability
- **Database performance**: Index optimization and query monitoring

---

*This plan prioritizes simplicity and maintainability for a solo founder while building a robust foundation for future scaling. Each phase delivers user value while maintaining system reliability.*