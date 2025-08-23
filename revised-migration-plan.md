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

**Production Deployment**:
- New service functions available alongside old queries
- Existing API routes can start using new services incrementally
- Zero breaking changes to existing functionality

**Rollback Plan**: Keep old query objects until Phase 7

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

## Phase 7: Client Migration & Type Integration
*Target: 5-7 days, Component-by-component rollout*

### Goals
- Replace `fetch()` calls with tRPC client calls
- Leverage auto-generated types throughout frontend
- Gradual component-by-component migration

### Sub-phases (by feature area):

#### 7A: Market Browsing Components
- Market search and listing pages
- Single market detail views
- **Deploy**: New market pages with tRPC

#### 7B: Prediction Components
- Prediction creation flows
- User prediction history
- **Deploy**: Prediction features with tRPC

#### 7C: Event & Category Pages
- Event browsing and filtering
- Category-based navigation
- **Deploy**: Event features with tRPC

### Migration Strategy per Component
1. **Feature flags**: Toggle between old/new API calls
2. **Type integration**: Remove manual DTOs, use generated types
3. **Error boundaries**: Update error handling for tRPC patterns
4. **Remove serialization**: Eliminate manual `serializeDecimals` calls

**Production Deployment**:
- Feature flags enable gradual rollout
- Real user testing with immediate rollback capability
- Component-by-component validation

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
   - Remove old API routes (after client migration complete)
   - Remove old query objects and DTOs
   - Remove manual serialization utilities
   - Clean up unused dependencies

3. **Documentation & Guidelines**
   - Update `CLAUDE.md` with new development patterns
   - Document tRPC patterns for future AI development
   - Code comments explaining key architectural decisions

**Production Deployment**: 
- Final cleanup deployment
- Legacy endpoints removed
- Full tRPC migration complete

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

---

## Timeline & Resource Planning

**Total Estimated Time**: 25-35 days
- **Phase 1**: 1-2 days (Analysis)
- **Phase 2**: 2-3 days (Schemas)  
- **Phase 3**: 3-4 days (Auth)
- **Phase 4**: 3-4 days (Services)
- **Phase 5**: 4-5 days (tRPC Endpoints)
- **Phase 6**: 2-3 days (Specialized)
- **Phase 7**: 5-7 days (Client Migration)
- **Phase 8**: 3-4 days (Cleanup)

**Resource Requirements**: 1 developer, with ability to pause/rollback at any phase

**Production Impact**: Minimal throughout, zero downtime, maintained performance

This revised plan ensures each phase delivers independent value while building toward the complete tRPC migration, with lessons learned from the initial implementation fully integrated.