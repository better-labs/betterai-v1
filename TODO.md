# epic: enable User Prediction v1

# FEAT_PREDICTION_GEN.md

**Feature:** Initial Prediction Generation Flow

**Goal:** Deliver a minimal but production-ready “Predict with AI” capability with credits, sessions, and results UI.

---

## TL;DR

* **Two pages:**
  1. `/predict/[marketId]` → Generator
  2. `/predict/[marketId]/[sessionId]` → Results
* **API:**
  * `predictions.start` → mutation (creates session, consumes credits)
  * `predictions.status` → query (polls session + predictions)
* **Worker:** sequential model execution; creates `Prediction` rows linked by `sessionId`
* **Credits:** charged at start, refunded only if all models fail
* **UX:** skeletons + spinner progress until finished/error

---

## Phase 1 — Schema & Credit System (Complete)

**Schema additions/changes**

* **PredictionSession (new)**
  * `id` (string, PK)
  * `userId` (FK → [User.id](http://User.id))
  * `marketId` (FK → [Market.id](http://Market.id))
  * `selectedModels` (string\[\])
  * `status` (enum: initializing | researching | generating | finished | error)
  * `step` (string, optional short label)
  * `error` (string, optional)
  * `createdAt`, `completedAt`
* **Prediction (existing)**
  * Add `sessionId` (FK → [PredictionSession.id](http://PredictionSession.id), nullable for legacy rows)
  * Optional: add `runModelName` (string) to enforce unique per session
* **User (existing)**
  * Already has: `credits`, `totalCreditsEarned`, `totalCreditsSpent`

**Credit manager logic**

* `getCredits(userId)` → return balance
* `consume(userId, amount, reason)` → deduct + record
* `refund(userId, amount, reason)` → restore + record

**Implementation: Service Layer Pattern**
* Create `lib/services/credit-service.ts` with functions accepting `db` parameter
* Support both PrismaClient and TransactionClient for atomic operations
* tRPC procedures use service via transactions: `creditService.consume(tx, userId, amount, reason)`
* Follows existing "fat services for writes" architecture

**Storage Decision: PostgreSQL (Recommended for v1)**
* Use existing PostgreSQL for PredictionSession storage
* Atomic credits + session creation in single transaction
* Easy debugging with SQL queries and existing tooling
* Fits service layer pattern perfectly
* Zero new infrastructure required


**Acceptance test**

* New user starts with 100 credits
* Consuming reduces balance
* Refund restores balance

---

## Phase 2 — API Surface

**tRPC Procedures**

* `predictions.start` (mutation):
  * Input: `marketId`, `selectedModels[]`
  * Verify credits ≥ models.length
  * Consume credits
  * Create `PredictionSession` (status=initializing, all models queued)
  * Fire worker job immediately (event-driven trigger)
  * Return `{ sessionId }`
* `predictions.status` (query):
  * Input: `sessionId`
  * Return `PredictionSession` fields + all `Prediction` rows linked to it
  * Ensure row belongs to current user

**Acceptance test**

* Start → returns sessionId + deducts credits
* Status → returns session object scoped to user

---

## Phase 3 — Worker

**Flow (sequential execution v1)**

1. Update session: `status=researching` (optional research step)
2. Update session: `status=generating`
3. For each model in `selectedModels`:
   * Mark model state = running (in session.step or logs)
   * Generate result via existing single-prediction logic
   * Create `Prediction` row with `sessionId` + `modelName`
   * On success: successCount++
   * On failure: mark failed (no throw)
4. After all models:
   * If all failed → refund credits, update session → `status=error`
   * Else → update session → `status=finished`, set `completedAt`

**Worker Timing & Triggers**
* **Trigger**: Event-driven on `predictions.start` + failure retry with exponential backoff
* **Frequency**: Simple approach - no complex queue needed initially
* **Implementation**: Direct function call in tRPC mutation for v1 simplicity
* **Retry Logic**: 3 attempts max with exponential backoff for failures
* **Timeout**: 10 minutes total session timeout
* **Cleanup**: Hourly job to handle stuck sessions

**Acceptance test**

* One success → session finished, at least one Prediction row exists
* Partial success → finished with failed markers
* All fail → error, refund

---

## Phase 4A — Pages & UX

**Prediction Generator Page (**`/predict/[marketId]`)

* Show market info + credit balance
* Model checklist (1–5)
* Generate button (disabled if insufficient credits)
* On click: call `predictions.start`, redirect to Results with `sessionId`

**Prediction Results Page (**`/predict/[marketId]/[sessionId]`)

* Poll `predictions.status(sessionId)` every 10-15s until `finished` or `error` (optimized frequency to reduce DB load while maintaining responsiveness)
* **Loading UX:**
  * Before first response: skeletons for global step + model rows
  * During polling:
    * Global step chip updates (Initializing → Researching → Generating…)
    * Model rows:
      * Queued → muted dot
      * Running → spinner + “running”
      * Completed → check icon + short preview
      * Failed → warning icon + “failed”
  * On finished: display full Prediction outputs per model
  * On error: show error alert + credits refunded note
* **A11y (if not too much effort):**
  * `aria-live="polite"` for global step
  * Spinner has `aria-label="Loading"`
  * Reduced-motion users see static skeletons

## Phase 4B Create a reusable `GeneratePredictionButton` and drop it into:

* Market Detail
* MarketList item
* Search Result item
* RecentPredictions (top + per-row)

Add the button in **four surfaces**. All buttons route to `/predict/[marketId]`.

### 1) Market Detail ( `/market/[marketId]` )

* **Placement:** Primary CTA in the header/action bar, near price/probability.
* **Behavior:**
  * Label: **“Predict with AI”**
  * Enabled if user is authed and has ≥1 credit; otherwise show disabled with tooltip (“Need 1+ credit”).
  * If the user already has a recent session (e.g., last 24h) for this market, show a secondary link: **“View last run”** → `/predict/[marketId]/[sessionId]`.
* **Click:** `router.push(/predict/${marketId})`.

### 2) MarketList item (cards/rows in lists)

* **Placement:** Right side of each list item (next to “View” / “Trade”).
* **Behavior:**
  * Compact button: **“Predict”**
  * Visible on hover for desktop; always visible on mobile.
  * Respect global disabled state (auth/credits).
* **Click:** `router.push(/predict/${marketId})`.

### 3) Search Results (market hits)

* **Placement:** Inline with each result, after title/snippet.
* **Behavior:**
  * Text button: **“Predict”**
  * On small screens fold into a 3-dot menu (… → Predict).
* **Click:** `router.push(/predict/${marketId})`.

### 4) RecentPredictions (user dashboard/feed)

* **Placement:** At the **top** of the module as a primary CTA and **per-row** as a subtle action.
* **Behavior:**
  * Top CTA: **“New Prediction”** (opens a small market picker → then routes to `/predict/[marketId]`).
  * Row action (for each prediction): **“Predict again”** (links to `/predict/[marketId]` and passes prior model choices via query, e.g., `?models=...`).
  * Also show **“View session”** → `/predict/[marketId]/[sessionId]`.

**Acceptance test**

* Skeleton visible initially
* Spinner visible while generating
* Transition to check/failed icons correctly
* Outputs render on finished
* Error shown with refund note

# Testing Button checklist (per surface)

* Button shows for all markets; hidden or disabled when:
  * user not authed (invokes auth → continues)
  * credits < 1 (opens credits modal)
* Navigates to `/predict/[marketId]` with correct marketId.
* “Predict again” carries `defaultModels` in query and preselects on Generator page.
* Analytics event logs `ui_surface`, `marketId`.
* No layout shift on hover/appear (reserve space).

---

## Phase 5 — Hardening & Analytics

**Rate limits**

* e.g. 10 predictions/hour, 50/day per user

**Logging**

* Prediction session start, per-model outcome, final status

**Analytics (MVP)**

* Predictions per user/day
* Success vs. failure rates per model

**Acceptance test**

* Limit exceeded → clean error
* Logs show lifecycle events
* Metrics visible in APM/logs

---

## Out of Scope (v1)

* Parallel model execution
* SSE/WebSockets (polling only)
* Activity index page
* Time estimates/percent bars
* Redis session store (Postgres fine for now)

---

## File Map (suggested)

* `app/predict/[marketId]/page.tsx` → Generator shell
* `app/predict/[marketId]/_client/Generator.client.tsx` → generator client
* `app/predict/[marketId]/[sessionId]/page.tsx` → Results shell
* `app/predict/[marketId]/[sessionId]/_client/Results.client.tsx` → poller client
* `server/routers/predictions.ts` → start + status API
* `server/jobs/predictions.ts` → worker logic
* `lib/services/credit-manager.ts` → credit helpers

---

## Test Plan (incremental)

1. **Phase 1:** Credits + schema verified
2. **Phase 2:** API start/status working with credits deducted
3. **Phase 3:** Worker generates predictions + updates session
4. **Phase 4:** Generator → Results flow works, skeletons/spinners visible
5. **Phase 5:** Rate limiting + logs validated

---

Do you want me to also draft the **Prisma schema diff** (just the `PredictionSession` + `sessionId` relation on Prediction) so you can copy it directly into your schema file?

## Metadata
- URL: [https://linear.app/betterai/issue/BET-17/epic-enable-user-prediction-v1](https://linear.app/betterai/issue/BET-17/epic-enable-user-prediction-v1)
- Identifier: BET-17
- Status: In Progress
- Priority: High
- Assignee: Unassigned
- Project: [2 - Private External Beta Launch](https://linear.app/betterai/project/2-private-external-beta-launch-623f2cea5b4b). 
- Created: 2025-08-17T18:10:20.552Z
- Updated: 2025-08-25T10:45:43.583Z

## Sub-issues

- [BET-16 Implement "credits" on the backend](https://linear.app/betterai/issue/BET-16/implement-credits-on-the-backend)
- [BET-61 feat: reminder to add Rate limiting to Prediction button and other user interactions](https://linear.app/betterai/issue/BET-61/feat-reminder-to-add-rate-limiting-to-prediction-button-and-other-user)