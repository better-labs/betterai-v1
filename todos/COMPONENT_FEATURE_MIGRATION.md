# Component to Feature-Based Architecture 
Note: (do not create a `/src` root folder)

Organize by **business domain** so the repo *screams what it does* (markets, predictions, users), not “I’m a React app.”

## Top-Level Layout
```
app/                # Next.js routes (migrate later)
features/           # Business domains
  market/
  prediction/
  user/
shared/             # Design system + generic utils (no business logic)
  ui/
  layout/
  providers/
  utils/
lib/                # DB, external integrations, server adapters
```

## Key Practices

### Client Components
- Use **`.client.tsx`** suffix for interactive components.
- Still include `'use client'` at the top—suffix is for humans, directive is for Next.

### Server-Only Code
- Keep DB, external API, and AI calls in **server-only modules**:
  - `features/<domain>/server/*` or `lib/server/*`
  - Add `import 'server-only'` at the top.
- Never import Prisma/external services inside `.client.tsx`.

### Rendering Strategy
- **Default to RSC** (server components).
- Keep client components as **small islands of interactivity**.
- **Mutations**: use **Server Actions via your tRPC layer** (invoke server actions from RSC or tiny client wrappers, but route domain logic through tRPC).

### Shared vs Feature
- `features/*`: domain-specific UI, hooks, calculations, validation, types.
- `shared/*`: truly generic (Button, Modal, formatters, constants).

## Example (Market)
```
features/market/
  MarketCard.tsx               # RSC by default
  MarketList.client.tsx        # Interactive list
  useMarketData.ts             # Domain hook (server-aware)
  marketCalculations.ts
  marketValidation.ts
  types.ts
```

---

# Migration Plan (Phased)

**Goal:** Refactor **only `/components`** into `features/*` now. Migrate `app/` later.

## Phase 1: Market
1. Create `features/market/` and move relevant components from `/components`.
2. Split interactive pieces into `.client.tsx` where needed; add `'use client'`.
3. Extract DB/AI/services into `features/market/server/` or `lib/server/`; add `import 'server-only'`.
4. Route mutations through **tRPC** server actions (no service logic in `.client.tsx`).

**Gate: Test/Build/Fix**
- Run unit tests: `pnpm test` (or `vitest run`)
- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm eslint .`
- Build: `pnpm next build`
- Resolve errors before proceeding.

## Phase 2: Prediction
Repeat Phase 1 steps for `features/prediction/`.

**Gate: Test/Build/Fix**
- `pnpm test`
- `pnpm tsc --noEmit`
- `pnpm eslint .`
- `pnpm next build`

## Phase 3: User
Repeat for `features/user/`.

**Gate: Test/Build/Fix**
- `pnpm test`
- `pnpm tsc --noEmit`
- `pnpm eslint .`
- `pnpm next build`

---

# Enforcement (lightweight)

- **ESLint**: block client→server leaks and cross-feature imports.
  - `no-restricted-imports`: disallow `@prisma/client` in `**/*.client.tsx`
  - boundaries plugin (or nx rule) to prevent deep cross-feature imports
- **Path alias** (optional while staying at repo root):
  - In `tsconfig.json`:
    ```json
    { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["*"] } } }
    ```

---

## After Phases (Later)
- Migrate `app/` pages/layouts to use the new feature modules.
- Introduce per-feature barrels (`features/market/index.ts`) and forbid deep imports via ESLint.

--- 

**Answer to your last question:** yes—migrating **only `/components`** into `features/*` first is a clean, low-risk path. Lock each phase with test/build gates, then tackle `app/` once the domains are stable.
