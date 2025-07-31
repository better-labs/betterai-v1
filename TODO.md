TODO.md

# Prototype


## Data Integration
-Test Integration via UI








curl --request GET \
  --url 'https://gamma-api.polymarket.com/events?limit=5&order=featuredOrder&ascending=true&closed=false' \ | jq 'map(. | del(.markets))'


## UX
- Fix event and market icons to display properly.
- Trigger new prediction from ..
-Fix Mobile view layout.
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

6. Add Jest Testing Infrastructure
Need unit tests for hooks and utilities
Need integration tests for API routes
Need component tests for UI logic


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