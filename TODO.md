# For the week of 8/8

- Question to enable answering: Does prediction accuracy go up when more models are used? 1, 10, 20, ...? 
- Scope cut for the UI for Friday to only show basic information. Such as individual predictions and AI prediction leaderboard?


## Now

- Fix generate-batch-predictions so that it does not use       await prisma.marketQueryCache.create({
- Rename marketQueryCache table to be more descriptive


## Benchmark and Prediction Data Pipeline

- [ ] Wire daily “Prediction checking” cron to compute AI vs. market deltas
  - [ ] Env: `CRON_SECRET`, `PREDICTION_CHECK_*` vars
  - [ ] Endpoint: `POST /api/cron/prediction-check`
  - [ ] Script: `pnpm cron:prediction-check`
- [ ] Schedule batch prediction generation (top 50 by volume ending ~7d)
  - [ ] Endpoint: `POST /api/cron/generate-batch-predictions`
  - [ ] Script: `pnpm cron:batch-predictions`
- [ ] Decide category strategy: exclude crypto vs. mark as less effective
  - Default: include all; segment metrics per category
- [ ] Add weekly evaluator to compute Brier/calibration for resolved markets (Phase 2)




## Test all the changes so far

## Data
- [ ] Fix market data from polymarket API so that it properly saves the "image" and "icon" urls, similar to how the event image and icon urls are saved to database.
Then update the predictions page to include market image.








# Week of 8/15

## UX

- Add AI leaderboard

- Take my top user flows and ask AI which is flow is most valuable and then ask how I can build and design on that
- Add some kind of rotating banner thing to the front page to get attention. maybe create a streaming list of lowest cost (flash) predictions, updating in realtime

## Data Sources
- [ ]Add Kalshi market data
- [ ] Raw responses from Kalshi and Polymarket:
   1. Keep the `markets` table. It is your canonical model.
   2. Create `_raw` tables for each data source (polymarket_raw, kalshi_raw).
   3. Build a processing pipeline (can be a simple cron job/script) that moves and transforms data from the _raw tables into the canonical markets table.
   4. Your application should only ever interact with the `markets` table. This creates a powerful abstraction layer that decouples your app from the specifics of the data sources.


## DB Ops
- Production database separation: now that I'm going to have a version of the app deployed to production and also do local development, should I create separate the database environments?
- Move from force-dynamic to ISR for events pages
When to use ISR vs SSR
  • Use ISR when:
    • Data can be slightly stale (e.g., 30–300 seconds).
    • You want static-like speed with periodic freshness.
  • Use SSR (force-dynamic or cache: 'no-store') when:
    • Data must be real-time or user/session-specific.
    • You cannot tolerate staleness.
  In your app
  • “Switch to ISR” means replacing force-dynamic with export const revalidate = <seconds> on pages like app/page.tsx, app/events/page.tsx, etc.,
    and adding revalidateTag(...) in cron/API routes that update markets/predictions, so the cache refreshes right after writes.



# UX
- Redesign UX - ask AI to help feedback on highest value and how to represent those minimally via UX.
  - Remove "trending" section on landing page.


## Tools to add
- Auth: maybe Clerk
- Payments: maybe Stripe
- Voice: Gemini live
- Operations: Vercel analytics, Vercel "Observability" features currently paid for
- Evaluate: hotjar, canny product request, sentry or logrocket


- Integrate so that Prediction Engine API uses the prediction service when button is clicked.
- Add necessary buttons Generate prediction button for all markets.


- Add "Alpha Signal" section after "Trending" section. Similar table, but organized by top alpha (free prediction) vs market prediction.


## User Authentication
- Review best options for user authentication
- Implement user authentication system

## Scale
- Add caching to data service layer calls.

## Maintenance




## E2E User flow
- Reflect on learning: both the model and dataset searches are many to many !!

## Authentication & Rate Limiting
- [ ] Design mechanism to prevent overuse of free prediction
  - [ ] Research Google user login integration
  - [ ] Ask AI to help design rate limiting strategy
  - [ ] Implement user authentication system

## Free Prediction Features
- [ ] Enable free button inference for market prediction
  - [ ] Add temporary output to result modal window
- [ ] Enable caching for free prediction

# Public Launch Prep

## Operational
- [ ] Research best practices for rate limiting and user authentication
- [ ] Implement user tracking analytics (hotjar, vercel analytics, sentry or logrocket)

## Security
- [] plan out and end to end 


## Docs to author
- [ ] Basic User Guide
- [ ] Terms of Service
- [ ] Privacy Policy





# Post Launch
- [ ] Submit to Polymarket Docs for Feature: https://docs.polymarket.com/quickstart/introduction/showcase#%F0%9F%A4%9D-want-to-be-featured%3F
- []Run a small “prediction tournament” with AI‑augmented suggestions—advertise it on the Polymarket and Kalshi channels. Real traders will jump at a chance to test new tooling in a competitive environment. 


## Completed
- [x] Add Dark mode
- [x] Add market data pull from Polymarket , pull-polymarket-data
- [x] Modify UX layout such that each row is an EVENT.
- [x] Add feature flags to hide login/signup button area in production

---

## Notes

---

## Trademark search guidance for "BetterLabs" (site: betterai.tools)

- USPTO (United States) — primary search
  - Go to the USPTO trademark search: [USPTO Trademark Search](https://www.uspto.gov/trademarks/search)
  - Search variants (Status: Live; focus on Classes 9, 35, 42 first):
    - Exact/near-exact: `betterlabs`, `"better labs"`, `betterlab`, `"better lab"`
    - Wildcards: `better*lab*`, `better*labs*`, plus "laboratory/laboratories" variants
  - For each hit: check goods/services, owner, mark type (word vs stylized), and likelihood-of-confusion.

- International quick screen
  - WIPO Global Brand DB: [WIPO Search](https://www3.wipo.int/branddb/en/)
  - EUIPO (if EU relevant): [EUIPO](https://euipo.europa.eu/)
  - UKIPO (if UK relevant): [UKIPO](https://trademarks.ipo.gov.uk/ipo-tmtext)

- Common‑law (unregistered) use
  - Web search: combinations like `"betterlabs" software`, `"better labs" ai`, `"betterlabs" saas`
  - Social/handles: X/Twitter, LinkedIn, GitHub, YouTube, Product Hunt for `betterlabs` / `better labs`
  - Domains: `betterlabs.com`, `betterlabs.ai`, `better-labs.com`, etc.

- State business name checks
  - Check your formation state’s Secretary of State database for corporate name conflicts (not a trademark, but useful).

- Distinctiveness notes
  - "Better" (laudatory) + "Labs" (descriptive) may be weak; USPTO may require disclaiming "LABS".
  - A stylized/logo mark can be easier initially; pursue a word mark when feasible.

- If clearance looks okay
  - File US application (1(b) intent-to-use if not yet in commerce; 1(a) with specimen if already in use).
  - Classes likely relevant: 42 (SaaS/AI services), 9 (software) and/or 35 (business/data services) depending on scope.
  - After US filing, consider Madrid Protocol for additional countries.

- If conflicts appear
  - Options: adjust mark (e.g., to a more distinctive name), file stylized logo first, or keep "BetterLabs" as corporate name and brand products under a distinct trademark (e.g., "BetterAI").

- Quick USPTO query set (copy/paste)
  - `betterlabs`
  - `"better labs"`
  - `better*lab*`

Note: Using `betterai.tools` as the website domain is fine; the trademark clearance focuses on the mark you will register (e.g., "BetterLabs").
