
# Week of 8/11

## Monday: Core Loop: Prediction Engine

DB changes:
markets.id and events.id need to be an integer.
predictions: remove probability column. Add column outcomes String[]. Add column outcomesProbabilities Decimal[].




- Test new Prediction prompt and pipeline.
Prediction detail page:
- Update Prediction card to be used on landing page "Recent AI Predictions" and Prediction detail page.



- User navigates to a prediction detail page. Clicks “Predict” ➞ receives an AI-generated outcome (confidence + share link). User-selectable model providers (ChatGPT, Gemini, Grok, Claude) OR 2-3 will be chosen automatically by default.
  - Go to Prediction Market: user can click through to the prediction market page on Polymarket.
  - "Explain Your Reasoning" — Let users drill down into why the AI made this prediction. Justify premium pricing — Deeper analysis commands higher prices than single predictions.
  - "Compare to Market" — Show how AI prediction differs from current market prices.
  - Verifiable Prediction: share exact prompt and dataset used. Valuable for trust in financial context; enables reproducibility and competitive advantage.

- Event detail page.

- Fix this URL? http://localhost:3000/market/[marketId]/predictions ? Or remove this page and make an expand section to show all predictions?

## Tuesday: UX enhancements
- Landing page:
  Trending events (bring it back)
  Track record:  "AI predicted X correctly this week".
- Core v0.2 data pipeline working, including: daily predictions, increase the number and quality of models used (add a few pro ones). Make a reminder to check cost each day an increment again.
- Fix @cron:prediction-check to add logs via console.log with metrics and success/failure.




## Wednesday
- Portfolio Watcher v1: import your active portfolio via public URL from Polymarket only. Enable users to manually select markets and trigger predictions.


## Thursday
- Account Creation & Authentication: Lightweight login via maybe Clerk or Auth.js or similar. Required for persisting predictions and preparing for payments.  *Alpha note*: Provide a free daily credit pool; skip the funding flow for now. Each new user signup gets 100 free credits, reset daily to at least 100.

- DB Ops Planning: production database separation: now that I'm going to have a version of the app deployed to production and also do local development, should I create separate the database environments?





### Operations
- Operations: Vercel analytics, Vercel "Observability" features currently paid for
- Evaluate: hotjar, canny product request, sentry or logrocket

### User Signup
- Share URL for users to signup for private beta and get 100 free daily credits for AI predictions.



### Category Fixes?
- Category fixes: Choose which categories to filter or down prioritize. consider enhancing my categories to match Polymarket's
- Decide category strategy: exclude crypto vs. mark as less effective
  - Default: include all; segment metrics per category

## Nice to have
- Add shadcdn styles and/or or framer motion animation: https://motion.dev/
- Landing page: "Today's Top Market Insights" (curated quality over quantity),
- Links to Markets, Events, internal and external on the markets, predictions and events pages are haphazard. Find a way to make them consistent.
- Add AI leaderboard?
- Add some kind of rotating banner thing to the front page to get attention. maybe create a streaming list of lowest cost (flash) predictions, updating in realtime
- Modify Market detail page to show visualization of prediction outcomes.














# Later (Date TBD)

## Scale
- Add caching to data service layer calls? Ask the AI


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

## Security
- Ask AI on best practices for end to end security review prior to public launch.


## Docs to author
- Basic User Guide
- Terms of Service
- Privacy Policy





# Post Launch
- [ ] Submit to Polymarket Docs for Feature: https://docs.polymarket.com/quickstart/introduction/showcase#%F0%9F%A4%9D-want-to-be-featured%3F
- []Run a small “prediction tournament” with AI‑augmented suggestions—advertise it on the Polymarket. Real traders will jump at a chance to test new tooling in a competitive environment. 

## Potential tasks
- Add shadcdn styles and/or or framer motion animation: https://motion.dev/


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
