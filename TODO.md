# For the week of 8/6

- Question to answer: Does prediction accuracy go up when more models are used? 1, 10, 20, ...?
- reflect on learning: both the model and dataset searches are many to many !!
- Scope cut for the UI for Friday to only show basic information. Such as individual predictions and AI prediction leaderboard?


- [ ] Consider whether to create a separate Polymarket_raw and kalshi_raw tables in the database to store the raw json response from the respective APIs or one shared table? What is best practice?
  
  Summary: Best Practice
   1. Keep the `markets` table. It is your canonical model.
   2. Create `_raw` tables for each data source (polymarket_raw, kalshi_raw).
   3. Build a processing pipeline (can be a simple cron job/script) that moves and transforms data from the _raw tables into the canonical
      markets table.
   4. Your application should only ever interact with the `markets` table. This creates a powerful abstraction layer that decouples your
      app from the specifics of the data sources.


## Categories
- [ ] Fix categories usage, ask AI how to manage one local project category vs native polymarket categories. 
- [] Decide whether to exclude certain categories like Bitcoin/Crypto price or simply mark them as less effective.

## Benchmark
- [ ] Create a “Prediction checking” CRON job that runs daily and computes the delta


# UX
- Add Kalshi market updates
- Redesign UX - ask AI to help feedback on highest value and how to represent those minimally via UX.
  - Remove "trending" section on landing page.


## Tools to add
- Auth: maybe Clerk
- Payments: maybe Stripe
- Voice: Gemini live


- Integrate so that Prediction Engine API uses the prediction service when button is clicked.
- Add necessary buttons Generate prediction button for all markets.


- Add "Alpha Signal" section after "Trending" section. Similar table, but organized by top alpha (free prediction) vs market prediction.


## User Authentication
- Review best options for user authentication
- Implement user authentication system

## Scale
- Add caching to data service layer calls.

## Maintenance

- Ask AI: are there important enhancements we should make to improve the codebase?


3. Standardize Error Handling
Create a consistent error handling pattern across all API routes
Implement proper error boundaries in React components
Add proper error types and messages


5. Break Down Large Components



## E2E User flow


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

## Security
- [] plan out and end to end 




# Post Launch
- [ ] Submit to Polymarket Docs for Feature: https://docs.polymarket.com/quickstart/introduction/showcase#%F0%9F%A4%9D-want-to-be-featured%3F
- []Run a small “prediction tournament” with AI‑augmented suggestions—advertise it on the Polymarket and Kalshi channels. Real traders will jump at a chance to test new tooling in a competitive environment. 


## Completed
- [x] Add Dark mode
- [x] Add market data pull from Polymarket , pull-polymarket-data
- [x] Modify UX layout such that each row is an EVENT.

---

## Notes

- Consider implementing analytics to track usage patterns