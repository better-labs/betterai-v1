## Prediction Generation: Lifecycle, Timing, and Queue Migration Plan

This document analyzes the current prediction generation lifecycle and timing, then proposes a Vercel-friendly migration to a professional job queue with options, tradeoffs, and a recommended path. The goal is higher reliability, observability, and control (rate limits, concurrency, retries), while staying simple for a solo developer and aligned with the service-layer pattern.

---

### 1) Current Lifecycle and Timing (as-implemented)

High-level flows discovered in code:

- Single prediction
  - Trigger: `POST /api/predict` (authenticated)
  - Path: `app/api/predict/route.ts`
  - Service: `lib/services/generate-single-prediction.ts` (core logic)
  - Rate limiting: `lib/rate-limit.ts` checked in route
  - Steps (simplified):
    - Validate auth & rate limit
    - Load market via service layer (Prisma)
    - Construct prompt, optional web search, call OpenRouter
    - Persist prediction, return DTO
  - Timing: synchronous request-response. Includes a deliberate `setTimeout(2000)` before model call to avoid rate limits.

- Batch predictions (daily)
  - Trigger: Vercel Cron → `GET /api/cron/daily-generate-batch-predictions`
  - Path: `app/api/cron/daily-generate-batch-predictions/route.ts`
  - Orchestration: `lib/services/generate-batch-predictions.ts`
  - Market selection: `getTopMarketsByVolumeAndEndDate(...)` (volume + event end window)
  - Generation: `generateBatchPredictions(marketIds, model, { concurrency })` iterates and calls `generatePredictionForMarket` per market
  - Current concurrency: effectively capped at 1–3 with manual backoffs to avoid rate limits; web search optional via env flags
  - Important: The cron route kicks off `Promise.all(models.map(runBatchPredictionGeneration))` and returns immediately (does not await). On serverless platforms, post-response execution is not guaranteed to complete; this is a reliability risk.

- Prediction sessions (multi-model for a user)
  - Router: `lib/trpc/routers/prediction-sessions.ts` (credits, validation)
  - Worker: `lib/services/prediction-session-worker.ts` runs models sequentially, logs progress, links predictions back to session
  - Recovery: `app/api/cron/session-recovery/route.ts` on a 15-min schedule

- Prediction checking (delta snapshots)
  - Trigger: Vercel Cron → `GET /api/cron/prediction-check`
  - Path: `app/api/cron/prediction-check/route.ts`
  - Service: `lib/services/prediction-checker.ts`
  - Behavior: kicks async work and returns; same post-response risk as batch

Key timing/operational constraints:

- OpenRouter/API backpressure: hard-coded waits and low concurrency to reduce rate-limit errors
- Serverless execution time: jobs may be terminated at response boundary or at function timeouts
- Missing durable orchestration: no native step retries with backoff/jitter, no durable state across steps, limited visibility into per-job lifecycle

Pain points:

- Fire-and-forget from serverless routes is unreliable
- Manual concurrency and setTimeout hacks to avoid rate limits
- Limited observability for long-running/batch work
- No built-in idempotency/dedup per (marketId, modelId) job

---

### 2) Goals for a Professional Queue

- Vercel-compatible: no always-on workers required on Vercel itself
- Durable orchestration: retries with exponential backoff, step checkpoints
- Concurrency control: global and per-key (e.g., per model, per marketId)
- Idempotency: avoid duplicate predictions for same (marketId, modelId, day)
- Observability: dashboard, structured logs, metrics, tracing
- Developer ergonomics: low code overhead, TypeScript-first where possible
- Minimal ops: avoid managing dedicated worker pods unless absolutely necessary

---

### 3) Options to Investigate

1) BullMQ + Redis
   - Summary: Popular Redis-backed queue. Requires long-running worker(s) to process jobs.
   - Pros:
     - Mature ecosystem; powerful features (flows, priorities, repeatable jobs)
     - Bull Board UI available; community knowledge abundant
     - Fine-grained control over concurrency and backoff
   - Cons (critical for Vercel):
     - Requires an always-on Node worker. Vercel serverless cannot host a persistent worker.
     - You must host workers elsewhere (Fly.io, Railway, AWS Fargate, etc.). This adds ops overhead.
     - Managing connection limits to Postgres from workers; must use proper pooling and DI of `db` into services
   - Vercel compatibility: Not native. Works only if you run workers off-Vercel.
   - When it adds value: If you’re willing to run a small, dedicated worker service (cheap on Fly/Railway) and want Redis-backed control with rich features.

2) Inngest (Serverless Workflows)
   - Summary: Event-driven durable functions with strong Vercel integration.
   - Pros:
     - Native Vercel integration; no dedicated workers to manage
     - Durable steps with automatic retries, backoff, fan-out/fan-in
     - Concurrency limits and rate limiting per function/key
     - Excellent developer UX (TypeScript), local dev server, built-in dashboard
     - Cron and event triggers; can replace “fire-and-forget” patterns safely
   - Cons:
     - Adds a vendor dependency and mental model (events/steps)
     - Less direct Redis-style control (but usually not needed in serverless)
   - Vercel compatibility: First-class. Likely the most frictionless path.
   - When it adds value: Orchestrating multi-step predictions/sessions, safe backgrounding, retries, and observability without running infra.

3) Upstash QStash (HTTP-based Queue)
   - Summary: Serverless HTTP task queue. Publishes jobs as HTTP calls to your endpoints with retries, schedules, and dedup keys.
   - Pros:
     - Zero compute to manage; simple model (HTTP in → HTTP out)
     - Idempotency keys, scheduled jobs, and DLQ-like patterns via retry policies
     - Excellent for “enqueue → call my Vercel route” workflows
   - Cons:
     - Limited orchestration compared to Inngest (no multi-step state machine)
     - Observability is simpler; complex fan-out/fan-in requires custom glue
   - Vercel compatibility: Very good; pairs well with serverless routes
   - When it adds value: If you want minimal moving parts and can keep orchestration logic simple in your API handlers.

4) Temporal Cloud (Durable Workflows)
   - Summary: Enterprise-grade workflow engine with strong guarantees.
   - Pros: Extremely robust, expressive workflows, great observability
   - Cons: Requires dedicated workers or managed cloud plan; higher complexity
   - Vercel compatibility: Not native; best when you can run workers elsewhere
   - When it adds value: If you need complex long-running workflows and are OK with higher ops.

---

### 4) Evaluation (solo dev, Vercel-first)

- Operability: Inngest ≈ QStash > BullMQ (needs workers) > Temporal (heaviest)
- Orchestration depth: Temporal > Inngest >> BullMQ ≈ QStash
- Dev ergonomics (TS + Vercel): Inngest > QStash > BullMQ > Temporal
- Cost/complexity: QStash ≈ Inngest (low) < BullMQ (needs worker hosting) < Temporal

Conclusion: Inngest best fits the current constraints and goals. QStash is a great second option if you prefer ultra-simple HTTP queues and are comfortable hand-rolling orchestration in the handlers. BullMQ is solid but requires running workers off Vercel.

---

### 5) Recommended Architecture: Inngest

Event model (proposed):

- `prediction.generate.single`
  - Data: `{ marketId, userId?, modelId, useWebSearch?, experimentTag?, experimentNotes? }`
  - Handler: Durable function with steps
    - Step 1: Load market via service layer
    - Step 2: Optional research step
    - Step 3: Call OpenRouter; automatic retry with exponential backoff on 429/5xx
    - Step 4: Persist prediction via service layer; idempotency key `(marketId, modelId, day)`

- `prediction.generate.batch`
  - Data: `{ modelId, targetDaysFromNow, endDateRangeHours, topMarketsCount }`
  - Handler: Durable function
    - Step 1: Select markets
    - Step 2: Fan-out to `prediction.generate.single` with per-key concurrency (e.g., per-model limit)
    - Step 3: Aggregate results for reporting/heartbeat

- `prediction.session.start`
  - Data: `{ sessionId }`
  - Handler: Iterate `selectedModels` from session, emit `prediction.generate.single` per model with sequential or controlled parallelism; update session step/status each iteration.

- `prediction.check.delta`
  - Data: `{ daysLookback, maxPredictions, includeClosedMarkets, excludeCategories }`
  - Handler: Run current checker with retries; store snapshots; emit heartbeat.

Concurrency and rate limits:

- Per model: cap concurrent `prediction.generate.single` jobs (e.g., 1–3 per model)
- Global: overall cap across functions to respect OpenRouter limits
- Backoff: exponential with jitter on 429/5xx; circuit-break heavy failures

Observability:

- Use Inngest dashboard for run timelines and errors
- Continue `structuredLogger` for app-level logs; include job IDs and correlation IDs

Idempotency:

- Add a unique constraint (or logical check) on `(market_id, model_id, date_bucket)` in services to avoid duplicates
- For sessions, link created predictions back to `sessionId` as done today

Security:

- Use Inngest signing keys; keep existing `CRON_SECRET` for legacy routes during migration
- No secrets in client; all invocations from server-side only

---

### 6) Alternative: BullMQ + Redis (if insisting on BullMQ)

Architecture sketch:

- Producer: Vercel API routes enqueue jobs to Redis (Upstash Redis works)
- Worker: A small Node worker (Fly.io/Railway) consumes jobs and calls our service-layer functions
- Concurrency: Configure per-queue; respect OpenRouter limits; implement exponential backoff
- Observability: Add Bull Board UI; forward logs to structured logger/console

Risks/overhead:

- Additional service to run/monitor (worker). Must handle Postgres connection pooling properly and environment parity.
- Deployment coordination across Vercel and worker platform.

This can work well if you’re comfortable owning a tiny worker service. Otherwise, prefer Inngest.

---

### 7) Migration Plan (Phased)

Phase 0 – Preconditions

- Add envs to `.env.example` and `.env.local` (non-interactive Vercel env updates):
  - INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY (if Inngest)
  - Or QSTASH_TOKEN (+ signing config) if using QStash
  - If BullMQ: REDIS_URL, QUEUE names, optional Bull Board auth

Phase 1 – Introduce queue producers (no consumers yet)

- Wire producers in:
  - `app/api/predict/route.ts`: enqueue `prediction.generate.single` instead of doing work inline; respond 202 Accepted with jobId
  - `app/api/cron/daily-generate-batch-predictions/route.ts`: enqueue `prediction.generate.batch`
  - `app/api/cron/prediction-check/route.ts`: enqueue `prediction.check.delta`
  - `lib/trpc/routers/prediction-sessions.ts`: enqueue `prediction.session.start`

- Keep current synchronous paths behind a feature flag (e.g., `QUEUE_EXECUTION_ENABLED`).

Phase 2 – Add consumers/handlers

- Inngest handlers that call existing service functions with DI `db` parameter
- Implement concurrency & retries per function (start conservatively: 1–2)
- Add idempotency checks in service layer for `(marketId, modelId, dateBucket)`

Phase 3 – Cutover

- Flip feature flag to queue execution for selected routes (e.g., batch first)
- Validate observability and success rates; adjust concurrency/backoff
- Remove fire-and-forget promises from cron routes

Phase 4 – Cleanup & Enhancements

- Remove setTimeout hacks and manual concurrency in services; rely on queue limits
- Add dead-letter handling and alerting (email/Slack) for repeated failures
- Expand sessions to support partial success UI via durable progress events

---

### 8) Implementation Notes (Service-Layer Pattern)

- Keep all DB operations in `lib/services/*` and pass an injected `db` client to functions invoked by the queue handlers.
- Never call Prisma directly in queue handlers; import services and mappers.
- For idempotency, create a helper in the service layer to upsert prediction keyed by `(marketId, modelId, day)`.
- Use tRPC inferred types in any UI components that consume queued results.

---

### 9) Pros/Cons Summary

- BullMQ + Redis
  - Pros: feature-rich, familiar; strong concurrency/backoff primitives
  - Cons: needs external worker; more ops; not Vercel-native

- Inngest
  - Pros: serverless-native, durable, great DX/observability, minimal ops
  - Cons: vendor lock-in; learn event/step model

- Upstash QStash
  - Pros: simplest; HTTP-first; good retry/scheduling; no workers
  - Cons: limited orchestration; compose yourself in handlers

Recommendation: Start with Inngest for durability + orchestration on Vercel. If you want the absolute minimum moving parts and can accept simpler flows, QStash is a close second. Use BullMQ only if you’re comfortable running a tiny external worker on Fly/Railway. Consider QStash if you later decide you want HTTP-only simplicity with lighter orchestration.

---

### 10) Concrete Next Steps (Actionable TODOs)

1. Add env variables to `.env.example` and Vercel (non-interactive): Inngest keys
2. Create `lib/queue/` and scaffold Inngest client + handlers (single, batch, session, checker)
3. Add `QUEUE_EXECUTION_ENABLED` feature flag; ship producers into routes (respond 202)
4. Implement idempotent save in prediction service; add unique index if desirable
5. Set conservative concurrency (1–2) per model; enable exponential backoff on 429/5xx
6. Remove fire-and-forget in cron routes; replace with enqueue calls
7. Add metrics/logs: correlation IDs, job IDs; integrate with structured logger
8. Roll out gradually: batch -> checker -> sessions -> single
9. Document runbook updates in `system-docs/RUNBOOK.md`

---

### 11) Risk Register

- Post-response execution loss (current) → mitigated by durable queue
- OpenRouter rate limits → per-model concurrency + backoff
- Duplicate predictions → idempotent keys & unique constraints
- Session partial failures → step-level retries and UI progress updates
- Ops surface area (BullMQ) → avoid by adopting Inngest or QStash

---

### 12) Rollout Guardrails

- Feature flag all queue-backed execution
- Start with shadow enqueue + synchronous continue; compare outcomes
- Enable queue-only for low-risk cron first, then expand
- Alert on error-rate regression; keep kill switch

---

### Final Recommendation

Adopt Inngest as the primary job/orchestration layer on Vercel. It delivers durable background execution, retries, concurrency control, and strong observability with minimal ops—ideal for a solo developer and this app’s workloads. Keep BullMQ as a fallback only if you decide to run a tiny external worker. Consider QStash if you later decide you want HTTP-only simplicity with lighter orchestration.

---

### 13) Added Workloads: Watchlists + Multi‑Step Prediction Builder

Workloads in scope:

- Watchlist daily email notifications to users
  - Requirements: daily scheduling, fan‑out by user, per‑user idempotency, batching/chunking, retries with backoff, monitoring, and optional rate caps to email provider.
- Prediction builder multi‑step pipelines
  - Requirements: real‑time triggering, step orchestration (research → generate → persist → notify), per‑step retries, state passing between steps, partial progress reporting, and concurrency limits per model/session.

Fit assessment:

- Inngest
  - Strengths: first‑class cron/events, durable step orchestration, automatic retries/backoff, per‑key concurrency, step‑level state, dashboards, near real‑time execution on Vercel.
  - Watchlists: emit `watchlist.email.daily` → fan‑out per user (chunked), enforce idempotency keys per user/day, backoff on provider 429/5xx, aggregate metrics.
  - Pipelines: `prediction.session.requested` → `step.run(...)` for each phase with progress updates; easy to resume on failure.
  - Overhead: minimal additional code; avoids custom glue for orchestration.

- QStash
  - Strengths: simple HTTP queue with dedupe keys, scheduling, retries; great for enqueue→call route patterns.
  - Watchlists: feasible via daily scheduled HTTP call, but you must implement chunking, progress tracking, aggregation, and DLQ/alerting logic yourself.
  - Pipelines: requires manual chaining of HTTP calls or a custom state machine in DB; step‑level retries and progress reporting are DIY.
  - Overhead: more custom orchestration code and operational glue.

Conclusion:

- These features lean strongly toward Inngest. It reduces custom orchestration, provides durable steps, and delivers near real‑time responsiveness required by the prediction builder. QStash remains viable for very simple scheduled fan‑outs, but the multi‑step pipeline and per‑user daily emails benefit significantly from Inngest’s built‑in orchestration, retries, concurrency, and observability.
