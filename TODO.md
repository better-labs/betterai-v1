# Week of 8/18

## Sunday


- Split database users to app & admin.
- Move planning to linear.
- Replan when is safe to launch to private beta users.


## Monday
Setup Github Action to pgdump to Vercel Storage nightly.
Remove backups older than 30 days.
Ask AI if I could do this somewhere else.
Update Runbook accordingly.




Security - Do now (blockers before external traffic)
- No bulk endpoints: Add pagination and strict max limit (e.g., 50–100). Remove/lock any dump-style routes.
- Per-user/IP rate limiting (basic): Implement a sliding-window limiter on all write/expensive endpoints. Key by userId or IP.
- Move DB Ops back to using betterai_app and betterai_admin for safety.

- Operations: Vercel analytics, Vercel "Observability" features currently paid  or BetterStack. Add performance metrics (execution time trends). Implement alerting thresholds



## Nice to have


- Data Pipeline: enhance research component to use the ":online" flag to do more data research.
- Modify Market detail page to show visualization of prediction outcomes.
- User mailing: add a beta program signup landing page with very little additional information.
Add Loops for email signup
https://loops.so/
- Security: per-user/IP quotas; no bulk endpoints; HMAC-signed requests; WAF + bot detection.





# Week of 8/21: 

- Organize todos vs design


- Implement "credits" on the backend.
  - Provide a free daily credit pool; skip the funding flow for now. Each new user signup gets 100 free credits, reset daily to at least 100.
  - Make the "add credits" button only appear when the user has less than 10 credits remaining?
  - Check on any legal considerations.

- Prediction button: User navigates to a prediction detail page. Clicks “Predict” ➞ receives an AI-generated outcome (confidence + share link). User-selectable model providers (ChatGPT, Gemini, Grok, Claude) OR 2-3 will be chosen automatically by default.
- Social: User is prompted to make the prediction public (optional). Share on social media.

- Landing page: AI Leaderboard:  "AI predicted X correctly this week".
  - Dimensions: AI model, tag.label, event duration.
  -  Make your track record a core, transparent part of the product from the very beginning.
  Make your track record a core, transparent part of the product from the very beginning.
  - Simply ranks the models based on their prediction outcome, accuracy
  
  - inspired by LLMArena





## Watchlist & Portfolio Watcher v1 Implementation Plan

### Phase 1: Database & Authentication Foundation
Done

### Phase 2: Core API Implementation  
- [ ] **Watchlist CRUD API**
  - `POST /api/watchlist` - Add market to user watchlist
  - `DELETE /api/watchlist/[marketId]` - Remove market from watchlist  
  - `GET /api/watchlist` - Get user's watchlist with market details
  - Add auth validation using Privy user context

### Phase 3: UI Components & User Experience
- [ ] **Watchlist UI Components**
  - Add bookmark/star icon to `MarketDetailsCard` component
  - Create `WatchlistPage` component at `/app/watchlist/page.tsx`
  - Build `WatchlistMarketCard` component showing position data + prediction trigger
  - Add watchlist navigation item to header (behind feature flag)


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

- [ ] **Enhanced Prediction API**
  - Extend `POST /api/predict` to accept watchlist context
  - Add batch prediction support for multiple markets
  - Track prediction source (manual vs automated watchlist)

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






# Future Weeks (Date TBD)

- Landing page: "Today's Top Market Insights" (curated quality over quantity),
- Event level predictions: Trigger multiple predictions for all markets in an event at once. Show event level difference (AI vs Human)


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

# Security
- DB user password(s) → new user or new password, revoke old.
- Any OAuth/client secrets → regenerate.

## Portfolio Tracker v2

- [ ] **Portfolio Import UI**
  - (Later) Create `UserPortfolioPosition` model for imported positions (user_id, market_id, position_data, imported_at)
  - Create portfolio import form/modal component  
  - Add portfolio import button to watchlist page
  - Show import status and validation feedback
  - Display imported positions in organized layout

- [ ] **Portfolio Import API**
  - `POST /api/portfolio/import` - Parse Polymarket portfolio URL and import positions
  - Research Polymarket public portfolio URL format and data structure
  - Create portfolio URL parser service in `lib/services/`
  - Validate and sanitize imported portfolio data

  
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
  - Ask AI to help design rate limiting strategy

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
- Move db credentials to using betterai_admin & betterai_app.


## Docs to author
- Basic User Guide
- Terms of Service
- Privacy Policy





# Post Launch
- [ ] Submit to Polymarket Docs for Feature: https://docs.polymarket.com/quickstart/introduction/showcase#%F0%9F%A4%9D-want-to-be-featured%3F
- []Run a small “prediction tournament” with AI‑augmented suggestions—advertise it on the Polymarket. Real traders will jump at a chance to test new tooling in a competitive environment. 

## Payments:
Privy like Stripe: create separate Privy apps (and App IDs) per environment: production, staging/preview, and local-dev. Lock each to its own Allowed Domains and Allowed OAuth redirect URLs.

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