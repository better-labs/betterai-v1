# Scaling Serialization: Framework Options for BetterAI

## Current State Assessment

Our manual serialization approach works but has scaling limitations:
- ✅ Explicit control and type safety
- ❌ Manual, repetitive, error-prone
- ❌ Maintenance overhead grows with codebase

## Recommended Upgrade Path

### Option 1: tRPC + Zod (Best for Long-term Scale)

**Why tRPC?**
- Automatic serialization of Decimals, Dates, etc.
- End-to-end type safety from Prisma to React
- Built-in input/output validation with Zod
- Eliminates need for manual serialization

**Implementation:**
```typescript
// lib/trpc/routers/prediction.ts
import { z } from 'zod'
import { procedure, router } from '../trpc'
import { predictionQueries } from '@/lib/db/queries'

const PredictionOutputSchema = z.object({
  id: z.string(),
  userMessage: z.string(),
  aiProbability: z.number(), // Automatically converts from Decimal
  // ... other fields
})

export const predictionRouter = router({
  getById: procedure
    .input(z.object({ id: z.number() }))
    .output(PredictionOutputSchema.nullable())
    .query(async ({ input }) => {
      const prediction = await predictionQueries.getPredictionWithRelationsById(input.id)
      // tRPC + Zod handles serialization automatically
      return prediction
    }),
})
```

**Benefits:**
- ✅ Zero manual serialization
- ✅ Automatic type inference
- ✅ Built-in validation
- ✅ Great DX with tRPC client

**Drawbacks:**
- ❌ Learning curve for team
- ❌ Another abstraction layer
- ❌ May be overkill for solo founder

### Option 2: Enhanced Current Approach

Keep current approach but make it more robust:

```typescript
// lib/db/auto-serialize.ts
import { serializeDecimals } from '@/lib/serialization'

// Higher-order function that auto-serializes any query result
export function withAutoSerialization<T extends (...args: any[]) => Promise<any>>(
  queryFn: T
): (...args: Parameters<T>) => Promise<SerializeDecimals<Awaited<ReturnType<T>>>> {
  return async (...args) => {
    const result = await queryFn(...args)
    return serializeDecimals(result)
  }
}

// Usage:
export const predictionQueries = {
  // Raw query
  getPredictionById: async (id: number) => { /* ... */ },
  
  // Auto-serialized version
  getPredictionByIdSafe: withAutoSerialization(
    async (id: number) => predictionQueries.getPredictionById(id)
  ),
}
```

### Option 3: SuperJSON Integration

More comprehensive serialization with superjson:

```typescript
// lib/superjson-setup.ts
import SuperJSON from 'superjson'
import { Decimal } from '@prisma/client/runtime/library'

// Register Decimal transformer
SuperJSON.registerCustom<Decimal, number>(
  {
    isApplicable: (v): v is Decimal => v instanceof Decimal,
    serialize: (v) => v.toNumber(),
    deserialize: (v) => new Decimal(v),
  },
  'decimal'
)

export { SuperJSON }

// Usage in components:
// Server Component
const data = SuperJSON.stringify(complexDataWithDecimals)
return <ClientComponent data={data} />

// Client Component  
const parsedData = SuperJSON.parse(data)
```

## Recommendation for BetterAI

**Short-term (Next 3-6 months):**
Keep current approach but enhance it with Option 2 - add the auto-serialization wrapper for new queries.

**Long-term (6+ months):**
Consider migrating to tRPC if:
- Team grows beyond solo founder
- API complexity increases significantly  
- Need more robust type safety across the stack

**Why this path?**
- ✅ Maintains current simplicity
- ✅ Gradual migration path
- ✅ Doesn't over-engineer for current scale
- ✅ Keeps options open for future growth

## Implementation Priority

1. **Immediate**: Add auto-serialization wrapper to prevent new bugs
2. **Next Sprint**: Migrate 2-3 most-used queries to auto-serialization
3. **Future**: Evaluate tRPC when team/complexity grows

This approach follows your "start simple, scale later" philosophy while preventing the serialization issues from becoming a bigger problem.
