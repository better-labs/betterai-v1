# For the week of 8/8

- Question to enable answering: Does prediction accuracy go up when more models are used? 1, 10, 20, ...? 
- Scope cut for the UI for Friday to only show basic information. Such as individual predictions and AI prediction leaderboard?


## UI


- UX: create a streaming list of lowest cost (flash) predictions, updating in realtime, with a "refresh" button.
- Create a Prediction detail page. ask AI to design the UX. Detail page should include links to the polymarket page.


- Draft simplest possible UI that shows predictions from the database.
- Production database separation: now that I'm going to have a version of the app deployed to production and also do local development, should I create separate the database environments?

- Create some cron job that generates simple low quality predictions for new markets ongoing.


- Add a "What is it" overview page, in lieu of docs that explain the benchmark and future app plans.

## Categories
- [ ] Fix categories usage, ask AI how to manage one local project category vs native polymarket categories. 
- [ ] Decide whether to exclude certain categories like Bitcoin/Crypto price or simply mark them as less effective.

## Benchmark
- [ ] Create a “Prediction checking” CRON job that runs daily and computes the delta






# Week of 8/15


## Data Sources
- [ ]Add Kalshi market data
- [ ] Raw responses from Kalshi and Polymarket:
   1. Keep the `markets` table. It is your canonical model.
   2. Create `_raw` tables for each data source (polymarket_raw, kalshi_raw).
   3. Build a processing pipeline (can be a simple cron job/script) that moves and transforms data from the _raw tables into the canonical markets table.
   4. Your application should only ever interact with the `markets` table. This creates a powerful abstraction layer that decouples your app from the specifics of the data sources.


# UX
- Redesign UX - ask AI to help feedback on highest value and how to represent those minimally via UX.
  - Remove "trending" section on landing page.


## Tools to add
- Auth: maybe Clerk
- Payments: maybe Stripe
- Voice: Gemini live
- Operations: Vercel analytics, hotjar, canny product request, sentry or logrocket


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
