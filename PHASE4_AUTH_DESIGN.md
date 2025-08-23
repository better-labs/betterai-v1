# Phase 4: Authentication Integration Design

## Problem Analysis

The current implementation has an **architectural mismatch** between:
- Existing Privy auth system using `CreateNextContextOptions` (Pages Router era)
- tRPC fetch adapter expecting `FetchCreateContextFnOptions` (App Router)

## Solution: Transport-Agnostic Authentication

### Core Design Principles
1. **Dual Context System**: Separate contexts for API routes vs Server Components
2. **Transport-Agnostic Auth**: Privy integration works with both Web Request and RSC headers
3. **Clean Separation**: Auth logic independent of Next.js request/response shapes

### Architecture Overview

```typescript
// Two context creators for different environments
createFetchContext()    // For /api/trpc endpoint (Web Request)
createRSCContext()      // For Server Components (headers/cookies)

// Shared auth core
getAuthCore({ cookie, authHeader }) // Pure function, no req/res coupling
```

### Implementation Plan

#### 1. Context Layer Refactor
```typescript
// lib/trpc/context/types.ts
export type AuthContext = {
  user: { id: string; email?: string } | null;
  session?: { token: string };
};

export type AppContext = AuthContext & {
  prisma: PrismaClient;
};
```

#### 2. Fetch Context (API Routes)
```typescript
// lib/trpc/context/fetch.ts
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createFetchContext(opts: FetchCreateContextFnOptions) {
  const auth = await getAuthFromRequest(opts.req);
  return { prisma, ...auth } satisfies AppContext;
}
```

#### 3. RSC Context (Server Components)
```typescript
// lib/trpc/context/rsc.ts  
export async function createRSCContext() {
  const auth = await getAuthFromHeadersCookies({
    headers: headers(),
    cookies: cookies()
  });
  return { prisma, ...auth } satisfies AppContext;
}
```

#### 4. Transport-Agnostic Privy Auth
```typescript
// lib/auth/privy-auth.ts
export async function getAuthFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const authHeader = req.headers.get('authorization') ?? '';
  return getAuthCore({ cookie, authHeader });
}

export async function getAuthFromHeadersCookies({ headers, cookies }) {
  const cookie = cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const authHeader = headers.get('authorization') ?? '';
  return getAuthCore({ cookie, authHeader });
}

async function getAuthCore({ cookie, authHeader }) {
  // Core Privy token validation logic
  // Works with raw strings, not req/res objects
}
```

#### 5. Updated API Handler
```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createFetchContext } from '@/lib/trpc/context/fetch';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createFetchContext, // Now properly typed
  });
```

#### 6. Server Caller for RSC
```typescript
// lib/trpc/server.ts
export async function getServerCaller() {
  const ctx = await createRSCContext();
  return createCallerFactory(appRouter)(ctx);
}

// Usage in RSC:
const api = await getServerCaller();
const data = await api.markets.search({ q: 'ETH' });
```

## Benefits of This Approach

### ✅ Architectural Alignment
- **App Router Compatible**: Uses proper fetch adapter types
- **SSR Optimized**: Server caller eliminates HTTP overhead
- **Type Safe**: End-to-end TypeScript with proper context types

### ✅ Development Experience  
- **Single Auth Logic**: Core function handles all token validation
- **Flexible Usage**: Works in both API routes and Server Components
- **Clean Separation**: Auth divorced from Next.js internals

### ✅ Migration Safety
- **Incremental**: Can migrate one procedure at a time
- **Backwards Compatible**: Existing REST endpoints unaffected
- **Testable**: Pure auth functions easier to unit test

## Migration Strategy

### Phase 4.1: Foundation
1. Implement dual context system
2. Refactor Privy auth to be transport-agnostic
3. Update tRPC handler to use fetch context

### Phase 4.2: Validation
1. Test auth flow with protected procedure
2. Verify both RSC and client component usage
3. Add smoke tests for auth states

### Phase 4.3: Rollout
1. Migrate high-value endpoints first
2. Monitor performance vs REST baselines
3. Gradual client-side adoption

This design resolves the architectural mismatch while setting up a robust foundation for the full tRPC migration.

## Decision Points

- **Adapter Choice**: ✅ Fetch adapter (App Router aligned)
- **Context Strategy**: ✅ Dual contexts (API + RSC)
- **Auth Pattern**: ✅ Transport-agnostic core with adapters
- **Migration Approach**: ✅ Incremental with parallel systems

Ready to implement this authentication architecture.