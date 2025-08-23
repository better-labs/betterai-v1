# Phase 1: tRPC Migration Analysis

## API Routes Audit

### Core API Endpoints (19 routes)
**Markets & Events:**
- `GET/POST/PUT/DELETE /api/markets` - Market CRUD operations 
- `GET /api/markets/trending` - Popular markets
- `GET /api/markets/[marketId]/prediction` - Single market prediction
- `GET/POST/PUT/DELETE /api/events` - Event CRUD operations

**Predictions & AI:**
- `POST /api/predict` - Generate AI prediction (auth required)
- `GET /api/predictions/recent` - User predictions (auth required)
- `GET /api/ai-models` - Available AI models

**User & Credits:**
- `GET/POST /api/user` - User profile (auth required)
- `GET/POST /api/user/credits` - Credits management (auth required)
- `GET /api/user/credits/status` - Credits status (auth required)

**Search & Discovery:**
- `GET /api/search` - Global search
- `GET /api/tags/popular` - Popular tags
- `GET /api/leaderboard` - Leaderboard data

**Admin & Pipeline:**
- `POST /api/run-data-pipeline` - Manual data sync (auth required)
- `GET /api/experiments` - Feature experiments

**Cron Jobs (4 routes - keep as REST):**
- `GET /api/cron/daily-update-polymarket-data`
- `GET /api/cron/daily-generate-batch-predictions` 
- `GET /api/cron/prediction-check`
- `GET /api/cron/update-ai-models`

## Serialization Points Analysis

### Current Serialization System
- **Primary utility:** `lib/serialization.ts` - handles Prisma Decimal → number conversion
- **Manual serialization calls** in components using `serializeDecimals()`
- **DTO pattern** in `lib/types.ts` with separate Server/Client types

### Key Serialization Patterns
1. **Prisma Decimal handling** - converts Decimal objects to numbers
2. **Date serialization** - converts Date objects to ISO strings  
3. **JSON field handling** - parses outcomePrices, outcomes arrays
4. **Manual wrapping** - components call serialization functions explicitly

### DTOs Currently Defined
- `EventDTO`, `MarketDTO`, `PredictionDTO`, `PredictionCheckDTO`
- `CreditBalanceServer` → `CreditBalanceClient` conversion
- `PolymarketEventDTO`, `PolymarketMarketDTO` for API responses

## Client API Usage Analysis

### Frontend Fetch Patterns
Components using direct API calls:
- `components/credits-display.tsx` - `/api/user/credits`
- `components/recent-predictions.tsx` - `/api/predictions/recent`
- `components/enhanced-search-box.tsx` - `/api/search`
- `components/leaderboard-wrapper.tsx` - `/api/leaderboard`
- `components/trending-events-table.tsx` - `/api/markets/trending`
- Plus 7 more components with API dependencies

### Breaking Changes Required
1. **Remove manual serialization calls** - tRPC handles automatically
2. **Replace fetch() calls** - convert to tRPC client calls
3. **Update type imports** - use tRPC-generated types
4. **Error handling changes** - adapt to tRPC error format
5. **Loading states** - integrate with React Query patterns

## Migration Priority Groups

### High Priority (Core functionality)
- `/api/markets/*` - Core market operations
- `/api/predict` - Main prediction feature
- `/api/user/*` - Authentication dependent

### Medium Priority  
- `/api/search`, `/api/leaderboard` - Discovery features
- `/api/events/*` - Event management
- `/api/predictions/recent` - User history

### Low Priority
- `/api/ai-models` - Reference data
- `/api/tags/popular` - Enhancement features
- `/api/experiments` - Feature flags

### Keep as REST
- All `/api/cron/*` endpoints - External webhook compatibility
- `/api/run-data-pipeline` - Admin tooling (consider later)

## Recommendations for Next Phase

1. **Start with markets router** - Most complex serialization requirements
2. **Implement auth procedures first** - Many endpoints depend on authentication  
3. **Create base Zod schemas** - Focus on Market, Event, Prediction, User models
4. **Test with single component** - Pick simple component for initial integration
5. **Maintain parallel endpoints** - Keep old routes during migration for safety