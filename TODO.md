
# Watchlist & Portfolio Watcher v1 Implementation Plan

## High-Level Implementation Strategy

Based on @DESIGN.md Phase 0 requirements, implement user-specific watchlist functionality and Polymarket portfolio import. This aligns with the "Portfolio Watcher v1" feature to enable users to manually select markets and trigger predictions.

**Core Features:**
1. **Watchlist Management**: Allow authenticated users to bookmark/track markets
2. **Portfolio Import**: Parse Polymarket public portfolio URLs to import user positions  
3. **Automated Monitoring**: Setup cron jobs for daily watchlist predictions and alerts
4. **UI Integration**: Add bookmark icons to market cards and dedicated watchlist pages

## Implementation Tasks

### Phase 1: Database & Authentication Foundation
- [ ] **User Authentication Integration** 
  - Research Privy user.id extraction for user-specific data
  - Test user identification across authenticated requests
  - Add user context to existing API routes that need user-specific data

- [ ] **Database Schema Design**
  - Create `User` model to store Privy user IDs and profile data
  - Create `UserWatchlist` model for market bookmarks (user_id, market_id, added_at)
  - (Later) Create `UserPortfolioPosition` model for imported positions (user_id, market_id, position_data, imported_at)
  - Add database indexes for performance (user_id, market_id combinations)
  - Run Prisma migration with `--force` flag as per repo guidelines

### Phase 2: Core API Implementation  
- [ ] **Watchlist CRUD API**
  - `POST /api/watchlist` - Add market to user watchlist
  - `DELETE /api/watchlist/[marketId]` - Remove market from watchlist  
  - `GET /api/watchlist` - Get user's watchlist with market details
  - Add auth validation using Privy user context

- [ ] **Portfolio Import API**
  - `POST /api/portfolio/import` - Parse Polymarket portfolio URL and import positions
  - Research Polymarket public portfolio URL format and data structure
  - Create portfolio URL parser service in `lib/services/`
  - Validate and sanitize imported portfolio data

- [ ] **Enhanced Prediction API**
  - Extend `POST /api/predict` to accept watchlist context
  - Add batch prediction support for multiple markets
  - Track prediction source (manual vs automated watchlist)

### Phase 3: UI Components & User Experience
- [ ] **Watchlist UI Components**
  - Add bookmark/star icon to `MarketDetailsCard` component
  - Create `WatchlistPage` component at `/app/watchlist/page.tsx`
  - Build `WatchlistMarketCard` component showing position data + prediction trigger
  - Add watchlist navigation item to header (behind feature flag)

- [ ] **Portfolio Import UI**
  - Create portfolio import form/modal component  
  - Add portfolio import button to watchlist page
  - Show import status and validation feedback
  - Display imported positions in organized layout

- [ ] **Enhanced Market Interactions**
  - Add "Add to Watchlist" action to market detail pages
  - Show watchlist status on market cards (bookmarked indicator)
  - Quick prediction triggers from watchlist view

### Phase 4: Automation & Monitoring
- [ ] **Watchlist Cron Jobs**
  - Create `cron-watchlist-predictions.js` for daily automated predictions
  - Extend existing `cron-prediction-check.js` to monitor watchlist markets
  - Add email notification service integration (optional future enhancement)
  - Schedule daily runs with proper error handling and backoff [[memory:6211559]]

- [ ] **Performance & Monitoring**
  - Add caching for frequently accessed watchlist data
  - Monitor API performance for user-specific queries
  - Add analytics tracking for watchlist usage patterns

### Phase 5: Polish & Feature Flags
- [ ] **Feature Flag Integration**
  - Add `SHOW_WATCHLIST` and `SHOW_PORTFOLIO_IMPORT` feature flags
  - Gate new UI components behind feature flags for gradual rollout
  - Update middleware.ts to handle new protected routes

- [ ] **Error Handling & UX**
  - Add comprehensive error handling for portfolio import failures
  - Implement optimistic UI updates for watchlist actions
  - Add loading states and success feedback


## Success Criteria
- Users can bookmark markets and view them in a dedicated watchlist page
- Users can import their Polymarket portfolio via public URL  
- Automated daily predictions run for watchlist markets
- Clean, intuitive UI matching existing design patterns
- Proper error handling and loading states throughout

---

# Week of 8/11



## Thursday




- Add a beta program signup landing page with very little additional information.
Add Loops for email signup
https://loops.so/



### Gating and egress control
- Auth-only access to full context; per-user/IP quotas; no bulk endpoints; HMAC-signed requests; WAF + bot detection.


Add BetterStack integration:
- [ ] **Add Observability**:
  - [ ] Add performance metrics (execution time trends)
  - [ ] Implement alerting thresholds
  Ask AI which Google Cloud features I could use in the next 90 days for free credit. Review my DESIGN.md and todo docs.







## Friday

Implement "credits" on the backend.
- Provide a free daily credit pool; skip the funding flow for now. Each new user signup gets 100 free credits, reset daily to at least 100.
- Make the "add credits" button only appear when the user has less than 10 credits remaining?
- Legal todos.


### Security - Do now (blockers before external traffic)

- No bulk endpoints: Add pagination and strict max limit (e.g., 50–100). Remove/lock any dump-style routes.
- Per-user/IP rate limiting (basic): Implement a sliding-window limiter on all write/expensive endpoints. Key by userId or IP.



### Operations
- Operations: Vercel analytics, Vercel "Observability" features currently paid  or BetterStack
- Look into Customer.io

### User Signup
- Share URL for users to signup for private beta and get 100 free daily credits for AI predictions.

- Prediction button: User navigates to a prediction detail page. Clicks “Predict” ➞ receives an AI-generated outcome (confidence + share link). User-selectable model providers (ChatGPT, Gemini, Grok, Claude) OR 2-3 will be chosen automatically by default.


### Category Fixes?
- Skip categories and focus on top used tag.Labels? yes I think so
- Category fixes: Choose which categories to filter or down prioritize. consider enhancing my categories to match Polymarket's
- Decide category strategy: exclude crypto vs. mark as less effective
  - Default: include all; segment metrics per category

### Google Auth
- Re-enable Google Oauth on App, but first try to add Google account - support@betterai.tools or hello@betterai.tools here: https://console.cloud.google.com/auth/overview/create?authuser=0&inv=1&invt=Ab5drg&project=future-synapse-469012-a0


## Nice to have

- Data Pipeline: significantly overhaul and improve research component.
- Landing page: Track record:  "AI predicted X correctly this week".
  - Add a “track record: X correct this week” block once we define the metric source.
- Landing page: "labels" adding most popular tag.labels to the top of the current trending view.

- Landing page: "Today's Top Market Insights" (curated quality over quantity),
- Links to Markets, Events, internal and external on the markets, predictions and events pages are haphazard. Find a way to make them consistent.
- Add AI leaderboard?
- Add some kind of rotating banner thing to the front page to get attention. maybe create a streaming list of lowest cost (flash) predictions, updating in realtime
- Modify Market detail page to show visualization of prediction outcomes.














# Later (Date TBD)

## Enhanced Predictions Across Markets
- Trigger multiple predictions for all markets in an event at once.

## Premium Features
- "Explain Your Reasoning" — Let users drill down into why the AI made this prediction. Justify premium pricing — Deeper analysis commands higher prices than single predictions.

## Scale
- Add caching to data service layer calls? Ask the AI
- Add some lightweight test case coverage?
- CRON Enhancmenets:
  - job that downloads event and market data for top events by volume (to overlap with the other existing one)
  -  rotate weekly segments (e.g., day-of-week partitions across the future horizon) to distribute the wider coverage.
  - prediction-check: hourly to track drift and outcomes sooner.
  - update-polymarket-data: every 6 hours for better market coverage.

  
## Operations & Database Recovery
- Decide whether or when to upgrade Neon's PITR to 7 days?
- Rename to .env.development (and .env.prod → .env.production).
- Add CI/CD integration Tests (tests/integration/) to auto run my existing scripts. First rename and better organize the current scripts.

## Revisit CRON default settings
- Consider finding a more full featured cron provider.
- Redesign CRON timings to make sense for use case.Eg
  pnpm cron:generate-batch-predictions && pnpm cron:prediction-check
  ..
  Starting batch prediction generation...
  Config: 10 markets, ±48h around 14 days from now
  Searching for markets ending between 2025-08-20T15:14:29.515Z and 2025-08-24T15:14:29.515Z
  Found 0 markets meeting criteria:
  No markets found matching the criteria


## Authentication & Rate Limiting
- Design mechanism to prevent overuse of free prediction
  - Research Google user login integration
  - Ask AI to help design rate limiting strategy
  - Implement user authentication system

## Free Prediction Features
- Enable free button inference for market prediction
  - Add temporary output to result modal window
- Enable caching for free prediction

# Public Launch Prep

## Operational
- Research best practices for rate limiting and user authentication
- Setup Database backups to Vercel Blob via GitHub actions

## Security
- Ask AI on best practices for end to end security review prior to public launch.


## Docs to author
- Basic User Guide
- Terms of Service
- Privacy Policy





# Post Launch
- [ ] Submit to Polymarket Docs for Feature: https://docs.polymarket.com/quickstart/introduction/showcase#%F0%9F%A4%9D-want-to-be-featured%3F
- []Run a small “prediction tournament” with AI‑augmented suggestions—advertise it on the Polymarket. Real traders will jump at a chance to test new tooling in a competitive environment. 


## Security 
Soon (first week after go-live)
Per-user quotas (persistent): Track daily/monthly quotas in DB/Redis; return 429 with helpful message; log overages.
HMAC-signed requests: Sign all internal cron → API calls and any incoming webhooks; rotate secrets via .env.

Later (defense-in-depth)
WAF + bot detection: Put Cloudflare in front (WAF rules, bot mode) and Turnstile on high-risk forms. Useful but can follow once basics are in place.

## Potential tasks
- Add shadcdn styles and/or or framer motion animation: https://motion.dev/





# Appendix

### How urgent is timing?
- **Window is open but not wide**: General-purpose AI aggregators can add “prediction-market” modes quickly. You likely have a 6–12 month window to establish data/UX moats before fast followers.
- **Ship early to compound moats**: Your strongest defenses (historical prediction lifecycle data, calibration, alpha scoring, personalization) only accrue with usage and time. Delays erode this.
- **Prioritize distribution now**: Secure traffic loops (SEO market pages, “AI vs market” leaderboards, shareable artifacts) and at least one partner integration. Distribution is harder to copy than code.

Actionable pace:
- Next 2–4 weeks: narrow v0 that proves “AI vs Market” value on a subset of categories; log full prediction lifecycle data.
- Next 6–8 weeks: ship basic calibration + “Market Alpha” score; add alerts and an Activity page to drive retention.
- Next 3–6 months: portfolio watcher “Active Agent” + factor library (“What Could Change This?”) to deepen moats.

### How easily can it be copied once public?
- **Easy to copy (weeks)**: UI, prompt scaffolding, basic multi-model calls, single-shot reasoning, public market ingestion.
- **Harder to copy (months, compounding)**:
  - End-to-end prediction dataset tied to outcomes
  - Calibration and ensembling tuned on your history
  - Proprietary “Market Alpha” signal using microstructure + external signals
  - Curated factor/event library and entity linking
  - Personalization/alerts from portfolio history
  - Cost/latency routing and caching at scale

### Defenses to implement now
- **Legal and policy**
  - ToS forbidding resale/training on outputs; API terms with quotas; DMCA-ready process.
- **Gating and egress control**
  - Auth-only access to full context; per-user/IP quotas; no bulk endpoints; HMAC-signed requests; WAF + bot detection.
- **Hold-back strategy**
  - Public: headline probability + short rationale. Logged-in: more detail. Paid: alpha score, alerts, full source bundles.
- **Artifact protection**
  - Signed expiring links, watermark shared PDFs/images, `noai,nosnippet` robots meta, share minimal reproducible seeds.
- **Keep crown jewels server-side**
  - Never expose prompts/retrieval sets/weights; only return calibrated probabilities and short explanations.
- **Moat compounding ops**
  - Nightly evaluation (Brier/log loss) + drift alerts; periodic feature rotation in alpha scoring to resist cloning.
- **Partnerships and data**
  - Secure exclusive or time-advantaged feeds where possible (curation partners, niche data sources).

If you move quickly on data capture, calibration, and distribution, you’ll be meaningfully ahead before general AI tools pivot into this niche.

- Shipped concise guidance on timing: move fast in 2–4 weeks to start compounding data moats; 6–12 month opportunity window.
- Clarified copyability: surface UI is easy to clone; lifecycle data, calibration, alpha scoring, and personalization are harder.
- Listed concrete defenses across legal, gating, hold-back, artifact protection, server-side secrecy, ops, and partnerships.