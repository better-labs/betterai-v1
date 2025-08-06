# For the week of 8/6

- Question to answer: Does prediction accuracy go up when more models are used? 1, 10, 20, ...?

# Enhancements

### 1. Consolidate the Redundant Data Access Layer
- [x] Merge all query logic from `lib/data/*.ts` into `lib/db/queries.ts`.
- [x] Refactor services and API routes to use the consolidated queries from `lib/db/queries.ts` exclusively.
- [x] Delete the `lib/data` directory once it's no longer in use.
- [x] (Performance) Refactor the `upsertEvents` and `upsertMarkets` functions in `lib/db/queries.ts` to perform true bulk upserts instead of looping.

### 2. Refactor Large Service Functions
- [x] Break down `updatePolymarketEventsAndMarketData` in `lib/services/events.ts` into smaller, single-responsibility functions.
- [x] Break down `generatePredictionForMarket` in `lib/services/prediction-service.ts` into smaller, single-responsibility functions.

### 3. Improve Type Safety
- [x] Define strong types for API payloads (e.g., from OpenRouter) and use them to parse the responses safely. Consider using Zod for validation.
- [x] Fix client-side types for `predictionResult` in `app/market/[marketId]/page.tsx` to avoid `as any` assertions.

### 4. Centralize Configuration and Hardcoded Values
- [ ] Move hardcoded values like API URLs, default model names, and cache durations into a centralized configuration file (e.g., `lib/config.ts`) or environment variables.

# Migration to Prisma
- [x] **Phase 1: Setup & Installation**
- [x] Install Prisma CLI (`prisma`) as a dev dependency and Prisma Client (`@prisma/client`) as a dependency.
- [x] Run `pnpm dlx prisma init` to create the `prisma` directory and `schema.prisma` file.
- [x] Configure the `datasource db` in `schema.prisma` to connect to your database using the `DATABASE_URL`.
- [x] **Phase 2: Schema Conversion & Generation**
- [x] Run `pnpm dlx prisma db pull` to introspect the existing database and generate the initial Prisma schema.
- [x] Manually review and refine the generated `schema.prisma`. Pay close attention to relations (`@relation`), enums, and any custom types. Ensure it matches the Drizzle schema's intent.
- [x] Run `pnpm dlx prisma generate` to generate the Prisma Client based on the new schema.
- [x] **Phase 3: Code Refactoring**
- [x] Create a single Prisma client instance (e.g., in `lib/db/prisma.ts`).
- [x] **Rewrite `lib/db/queries.ts`:** Methodically translate all Drizzle queries in `lib/db/queries.ts` to their Prisma Client equivalents. This is the largest task of the migration.
- [x] Search the rest of the codebase for any other direct usages of the Drizzle client and replace them.
- [x] **Phase 4: Migration & Cleanup**
- [x] Create an initial "baseline" migration with Prisma to align its migration history with the current schema: `pnpm dlx prisma migrate dev --name initial-migration`.
- [x] Update `package.json` scripts: remove Drizzle commands and add Prisma equivalents (e.g., `prisma:generate`, `prisma:migrate`, `prisma:studio`).
- [x] Uninstall Drizzle packages: `pnpm remove drizzle-orm drizzle-kit @neondatabase/serverless`.
- [x] Delete old Drizzle files: `drizzle.config.ts` and the contents of `lib/db/migrations`.
- [x] **Phase 5: Verification**
- [x] Update any database-related tests in the `test/` directory to use the new Prisma setup.
- [x] Thoroughly test the application locally to ensure all database interactions work as expected.

# Post migration manual testing
- [] test data downloads and similar ..
- [] try adding new tables and columns to existing tables.


## Afternoon work 

- [ ] Reflect on learning: both the model and dataset searches are many to many !!
- [ ] Generate Free predictions for same markets with data from API provider.
- [] Consider whether to create a separate Polymarket_raw and kalshi_raw tables in the database? I like that approach.
- [ ] Fix categories usage, ask AI how to manage one local project category vs native polymarket categories. 
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
- [x] Allow user to trigger prediction for a given market
- [x] Add hyperlink to markets
- [x] Display latest market prediction from database when AI prediction doesn't exist

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

## Legal
Check Copyright concerns with name?
Generate Terms of Service & Privacy Policy
Terms of Service: Have a clear and robust ToS that prohibits users from scraping your results, reverse-engineering the service, or using your output to train a competing AI model. While difficult to enforce perfectly, it provides a legal foundation.


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