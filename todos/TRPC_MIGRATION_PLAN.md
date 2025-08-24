# Revised tRPC + Zod Migration Plan for BetterAI

## Executive Summary

This revised plan incorporates all lessons learned from the initial migration attempt. Each phase can be fully tested and deployed to production independently, minimizing risk and allowing for gradual rollout.

**Key Change**: Breaking migration into 8 smaller phases instead of 6 large ones, each deployable independently.

---

## Phase 1: Foundation & Analysis ✅ COMPLETE
*Target: 1-2 days, Zero production impact*

### Goals
- Understand current system without breaking anything
- Establish testing baseline
- Set up parallel infrastructure

### Tasks
1. **Current API Analysis**
   - Audit all `/api/*` routes and their usage patterns
   - Document existing DTOs and serialization points  
   - Map client-side API calls and dependencies

2. **Testing Baseline**
   - Run existing test suite and document results
   - Establish performance baselines for critical endpoints
   - Document key user flows that must work identically

3. **Parallel Infrastructure Setup**
   - Install tRPC dependencies alongside existing system
   - Create basic tRPC setup without replacing anything
   - Configure development tools and type checking

**Output**: `PHASE1_ANALYSIS.md` with comprehensive system understanding

**Production Deployment**: None (analysis only)

---

## Phase 2: Schema Design & Type Safety ✅ COMPLETE  
*Target: 2-3 days, Zero production impact*

### Goals
- Create comprehensive Zod schema system
- Handle Prisma serialization challenges
- Validate schema design with existing data

### Tasks
1. **Core Zod Schemas**
   - Input schemas: Request validation with proper error messages
   - Transform schemas: Handle Prisma `Decimal` → `number` conversions
   - Base model schemas: User, Event, Market, Prediction models

2. **Schema Testing**
   - Validate schemas against existing API responses
   - Test Decimal serialization with real data
   - Ensure enum compatibility (Category, etc.)

**Output**: Complete `lib/trpc/schemas/*` with validated type safety

**Production Deployment**: None (schema files only, not used yet)

---

## Phase 3: Authentication Modernization ✅ COMPLETE
*Target: 3-4 days, Independent deployment*

### Goals  
- Solve authentication architecture incompatibility
- Create transport-agnostic auth system
- Enable both API routes and Server Components

### Tasks
1. **Transport-Agnostic Auth Core**
   - Refactor Privy integration to accept raw cookies/headers
   - Remove dependencies on Next.js req/res objects
   - Create `getAuthCore(cookies, headers)` function

2. **Dual Context System**
   - Fetch context creator: For `/api/trpc` routes
   - RSC context creator: For Server Components
   - Both using same auth core with different transport layers

3. **tRPC Integration**
   - Update tRPC server to use fetch context
   - Create server caller for RSC usage (no HTTP hop)
   - Test protected procedures work correctly

**Production Deployment**: 
- Deploy auth improvements independently
- All existing endpoints continue working
- New auth system available for future use

**Rollback Plan**: Keep old auth functions until Phase 7

---

## Phase 4: Service Layer Modernization 🔄 IN PROGRESS
*Target: 3-4 days, Independent deployment*

### Goals
- Replace object-based query patterns with clean service functions
- Enable dependency injection for better testing
- Create reusable service layer regardless of tRPC adoption

### Sub-phases (deployable independently):

#### Phase 4A: Core Data Services (Markets & Events) ✅ COMPLETE
*Target: 2 days*
- Convert `marketQueries` → `lib/services/market-service.ts` 
- Convert `eventQueries` → `lib/services/event-service.ts`
- Create standardized DTO mappers in `lib/dtos/`
- Update 2-3 API routes to use new services

#### Phase 4B: User & Prediction Services ✅ COMPLETE
*Target: 1-2 days*
- Convert `predictionQueries` → `lib/services/prediction-service.ts`
- Convert `userQueries` → `lib/services/user-service.ts` 
- Integrate with existing `CreditManager` class patterns
- Update remaining API routes

#### Phase 4C: Supporting Services (Search, Leaderboard, etc.) ✅ COMPLETE
*Target: 1 day*
- Convert remaining query files: `search`, `leaderboard`, `ai-model`, etc.
- Ensure all services follow consistent patterns
- Complete API route migrations

#### Phase 4D: Pattern Validation & Documentation ✅ COMPLETE
*Target: 0.5 day*
- Validate dependency injection works with tRPC
- Document service patterns for Phase 5
- Update project documentation

### Tasks
1. **Service Function Pattern**
   - Convert `marketQueries.functionName()` → `functionName(db, params)`
   - Services accept `PrismaClient | TransactionClient` for flexibility
   - Clean named exports instead of object namespaces

2. **DTO Standardization**
   - All services return consistent DTOs (never raw Prisma models)
   - Proper Decimal serialization in service layer
   - Consistent error handling patterns

3. **Database Pattern Evolution**
   - Reads: Thin services (query + serialize)
   - Writes: Fat services (validation + transactions + side effects)
   - Clear separation of concerns

4. **Directory Structure Adoption**
   - Establish target layout for services, DTOs, and tRPC
   - Migrate incrementally without breaking existing imports
   - Keep `lib/db/queries/` until Phase 8, prefer new `lib/services/`
   - Align with Zod input-only schemas and inferred outputs

**Production Deployment**:
- New service functions available alongside old queries
- Existing API routes can start using new services incrementally
- Zero breaking changes to existing functionality

**Rollback Plan**: Keep old query objects until Phase 7

---

## Target Directory Structure & Conventions

Adopt this structure during Phases 2–5 to keep concerns clear and migration incremental:

```text
app/                         # Next.js App Router pages and layouts
features/                    # Business domains (✅ COMPLETED MIGRATION)
  market/                    # Market-related components and logic
    MarketCard.tsx           # RSC components
    MarketList.client.tsx    # Interactive components
    types.ts                 # Domain-specific types
  prediction/                # Prediction components and logic
    PredictionModal.client.tsx
    PredictionSummaryCard.tsx
  user/                      # User authentication and profile
    UserCreditsDisplay.client.tsx
    UserAuthButtons.client.tsx
shared/                      # Design system + generic utils
  ui/                        # Reusable UI components
  providers/                 # React providers
  utils/                     # Generic utilities
lib/
  services/                  # Domain logic. Accepts PrismaClient | TransactionClient.
  dtos/                      # DTO mappers and response shapes; no Prisma types leak.
  trpc/
    routers/                 # Thin procedures; import services + Zod inputs only.
    schemas/                 # Zod input schemas only (no .output()).
    client.ts                # tRPC client + React Query hooks.
    server.ts                # createCallerFactory() server caller (RSC/SSR, no HTTP hop).
    context/                 # Auth/context creators for fetch and RSC.
```

Conventions:
- No Prisma usage in `trpc/routers`, `features/`, or `shared/` code; Prisma is confined to `lib/services/`.
- Services return DTOs (never raw Prisma models); map via `lib/dtos/` as needed.
- Zod validates inputs only; response types are inferred from services.
- Feature flags gate client migrations; keep legacy REST until Phase 8 cleanup.
- Feature components use `.client.tsx` suffix for interactive components, RSC by default.
- Existing `lib/trpc/routers/*`, `lib/trpc/context.ts`, and `lib/trpc/trpc.ts` remain valid; add `schemas/` (Phase 2), and `server.ts` for server caller (Phase 3).

Migration notes:
- New services live in `lib/services/` and can be adopted incrementally by existing REST endpoints before tRPC.
- `lib/db/queries/` remains during migration for rollback; deprecate and remove in Phase 8.
- Feature-based architecture is complete: components organized by business domain rather than technical layer.

---

## Phase 5: Core tRPC Endpoints
*Target: 4-5 days, Feature-by-feature deployment*

### Goals
- Implement tRPC procedures for core data operations
- Enable parallel operation with existing REST endpoints
- Validate end-to-end tRPC functionality

### Sub-phases (deployable independently):

#### 5A: Markets API
- Search, filtering, single market queries
- CRUD operations with proper auth (admin only)
- **Deploy**: Markets tRPC alongside existing REST

#### 5B: Events API  
- Event listings with market relationships
- Category-based filtering
- **Deploy**: Events tRPC alongside existing REST

#### 5C: Predictions API
- User predictions with market context
- Prediction statistics and history
- **Deploy**: Predictions tRPC alongside existing REST

### Key Implementation Lessons Applied
1. **No `.output()` schemas** - Let tRPC infer types from service returns
2. **Input validation only** - Zod for requests, inferred types for responses  
3. **Proper enum handling** - Convert Zod enums to Prisma enums as needed
4. **Consistent error patterns** - Meaningful error messages throughout

**Production Deployment**: 
- Each sub-phase can be deployed independently
- A/B test tRPC vs REST endpoints
- Feature flags control which clients use which endpoints

---

## Phase 6: Specialized Endpoints & Cron Integration
*Target: 2-3 days, Independent deployment*

### Goals
- Handle non-standard endpoints that need special treatment
- Ensure Vercel Cron continues working seamlessly
- Address file uploads and webhooks

### Tasks
1. **Cron Job Integration**
   - Maintain existing webhook-style endpoints for Vercel Cron
   - Use tRPC server caller internally for consistency
   - Ensure `CRON_SECRET` authentication works

2. **Special Cases**
   - File upload endpoints (if any)
   - External webhook endpoints  
   - Any non-JSON API requirements

**Production Deployment**:
- Cron jobs continue working without interruption
- Special endpoints maintained as needed

---

## Phase 7: Client Migration & Type Integration ✅ COMPLETE
*Target: 5-7 days, Component-by-component rollout*

### Goals
- Replace `fetch()` calls with tRPC client calls
- Leverage auto-generated types throughout frontend
- Gradual component-by-component migration

### Sub-phases (by feature area):

#### 7A: Market Feature Components
- Update `features/market/` components to use tRPC
- Market search, listing, and detail views 
- Leverage existing RSC/client patterns
- **Deploy**: Market features with tRPC

#### 7B: Prediction Feature Components  
- Update `features/prediction/` components to use tRPC
- Prediction creation flows and history displays
- Modal interactions and reasoning cards
- **Deploy**: Prediction features with tRPC

#### 7C: User Feature Components
- Update `features/user/` components to use tRPC
- Authentication flows and credit displays  
- User profile and analytics integration
- **Deploy**: User features with tRPC

#### 7D: Event Feature Components (Future)
- Create `features/event/` and migrate event components
- Event browsing and category filtering
- **Deploy**: Event features with tRPC

### Migration Strategy per Component
1. **Feature flags**: Toggle between old/new API calls
2. **Type integration**: Remove manual DTOs, use generated types
3. **Error boundaries**: Update error handling for tRPC patterns
4. **Remove serialization**: Eliminate manual `serializeDecimals` calls
5. **API Consolidation**: Migrate deprecated tRPC procedures to modern equivalents

### tRPC API Migration Patterns

#### Markets API Migration:
- ❌ **Remove**: `trpc.markets.getByEventId()` → ✅ **Use**: `trpc.markets.list({ eventId })`
- ❌ **Remove**: `trpc.markets.search()` → ✅ **Use**: `trpc.markets.list({ search })`
- ✅ **Keep**: `trpc.markets.getById()` (single market queries)
- ✅ **Keep**: `trpc.markets.trending()` (different data structure with event context)
- ✅ **Primary**: `trpc.markets.list()` (unified endpoint for all market querying)

#### Component Migration Examples:
```typescript
// ❌ OLD: Multiple endpoints
const marketsByEvent = await trpc.markets.getByEventId.query({ eventId })
const searchResults = await trpc.markets.search.query({ query: "election" })

// ✅ NEW: Unified endpoint
const marketsByEvent = await trpc.markets.list.query({ eventId })
const searchResults = await trpc.markets.list.query({ search: "election" })
```

**Production Deployment**:
- Feature flags enable gradual rollout
- Real user testing with immediate rollback capability
- Component-by-component validation
- Deprecated procedures marked with `.meta({ deprecated: true })`

---

## Phase 8: Validation, Cleanup & Documentation
*Target: 3-4 days, Final production deployment*

### Goals
- Complete migration with full confidence
- Remove all legacy code
- Document new patterns for future development

### Tasks
1. **End-to-End Validation**
   - Functionality tests: All features work identically
   - Performance tests: Compare against Phase 1 baselines
   - Type safety tests: End-to-end type coverage
   - Edge case validation: Error conditions and boundary cases

2. **Legacy Code Removal**
   - Remove old REST API routes (after client migration complete)
   - Remove deprecated tRPC procedures:
     - `markets.getByEventId` → replaced by `markets.list({ eventId })`
     - `markets.search` → replaced by `markets.list({ search })`
   - Remove old query objects (`lib/db/queries/`)
   - Remove old DTOs and manual serialization utilities
   - Clean up unused dependencies and imports

3. **Documentation & Guidelines**
   - Update `CLAUDE.md` and .cursor/rules/general-cursor-project-rule.mdc with new development patterns from this project.
   - Document tRPC patterns for future AI development
   - Code comments explaining key architectural decisions

4. **Deprecated Procedure Cleanup**
   - Search codebase for usage of deprecated procedures:
     - `trpc.markets.getByEventId` usage
     - `trpc.markets.search` usage
   - Verify all clients migrated to `trpc.markets.list`
   - Remove deprecated procedures from router
   - Update TypeScript types to reflect removed procedures

5. Resolve open lint errors if simple. If not, explain the error to user and suggest a tactical fix and more comprehensive best practice fix.
6. Resolve any TODOs like "TODO: Fix types after tRPC migration complete" and similar




**Production Deployment**: 
- Final cleanup deployment
- Deprecated tRPC procedures removed
- Legacy REST endpoints removed
- Full tRPC migration complete

**Validation Checklist**:
- [ ] No usage of `markets.getByEventId` in codebase
- [ ] No usage of `markets.search` in codebase  
- [ ] All components use `markets.list` for market querying
- [ ] TypeScript compilation succeeds after procedure removal
- [ ] End-to-end tests pass with new API patterns





---

## Key Lessons Learned Applied

### 1. Authentication Architecture
- **Problem**: Pages Router patterns incompatible with App Router tRPC
- **Solution**: Transport-agnostic auth accepting raw strings, dual context system
- **Applied**: Phase 3 dedicated entirely to auth modernization

### 2. Database Query Evolution
- **Problem**: Object-based exports don't align with tRPC patterns
- **Solution**: Named service functions with dependency injection
- **Applied**: Phase 4 focused on service layer before tRPC endpoints

### 3. Build Errors Indicate Design Issues  
- **Problem**: Persistent errors reveal architectural misalignments
- **Solution**: Address architectural issues before tactical fixes
- **Applied**: Separate phases for architecture vs implementation

### 4. Progressive Enhancement Strategy
- **Problem**: All-at-once migrations are high risk
- **Solution**: Build new alongside old, maintain rollback paths
- **Applied**: Every phase maintains parallel operation until cleanup

### 5. Transport-Agnostic Design
- **Problem**: Modern full-stack needs multi-context auth
- **Solution**: Core functions work with Web API, Next.js headers, React Query
- **Applied**: Auth system designed for all transport layers from start

---

## Production Deployment Strategy

### Risk Mitigation
1. **Feature Flags**: Every phase uses flags for gradual rollout
2. **Parallel Operation**: Old and new systems run side-by-side until validation
3. **Immediate Rollback**: Each phase can be instantly reverted
4. **Monitoring**: Performance and error tracking throughout migration
5. **User Testing**: Real user validation before removing legacy code

### Testing Approach Per Phase
1. **Contract Tests**: Ensure new implementations match old behavior exactly
2. **Integration Tests**: Full user workflows end-to-end  
3. **Performance Tests**: Latency and throughput comparisons
4. **Type Safety Tests**: Compile-time and runtime type validation

### Golden Rules Applied

#### Data Strategy
- **Reads → RSC**: Direct DB/tRPC server caller, cached appropriately
- **Writes → tRPC Mutations**: Client components use validated mutations
- **SSR Intentional**: Only when data must be fresh on every request

#### Code Architecture  
- **Thin Routers**: Input validation + auth + delegate to services
- **Fat Services**: Domain logic + transactions + idempotency + DTO mapping
- **DTOs Everywhere**: Never expose raw Prisma models
- **Named Functions**: Clean service exports, not object namespaces

#### Safety & Operations
- **Zod Everywhere**: Input validation and transformation
- **Observability**: Logs, tracing, metrics throughout
- **Rate Limiting**: Built into tRPC procedures
- **Kill Switches**: Feature flags enable instant rollback
