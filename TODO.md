TODO.md

# Prototype

## UX

- Action should be ""Get AI Prediction"

2. Implement Custom Hooks for State Management
Create useMarketTable() hook to encapsulate all the complex state logic
Create usePredictions() hook for prediction-related state
Create useExpandedState() hook for expand/collapse logic

3. Standardize Error Handling
Create a consistent error handling pattern across all API routes
Implement proper error boundaries in React components
Add proper error types and messages

4. Separate Mock Data from Production Logic
Create a clear separation between development and production data sources
Add environment-based data source switching
Document what's mock vs. real

5. Break Down Large Components
Extract MarketTable into smaller, focused components
Create dedicated components for data fetching, state management, and UI rendering
Implement proper separation of concerns

6. Add Proper Testing Infrastructure
The current test setup is minimal
Need comprehensive unit tests for hooks and utilities
Need integration tests for API routes
Need component tests for UI logic

7. Integrate ORM and service backend from other project


Example working trends command:

curl --request GET \
  --url 'https://gamma-api.polymarket.com/events?limit=5&order=featuredOrder&ascending=true&closed=false' \ | jq 'map(. | del(.markets))'


## E2E User flow
- [ ] Allow user to trigger prediction for a given market
- [ ] Add hyperlink to markets

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