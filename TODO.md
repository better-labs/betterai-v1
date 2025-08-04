TODO.md

# Prototype


# Database
✅ Generate a new model table for ai models named "ai_models". Copy the fields in the response from https://openrouter.ai/docs/api-reference/list-available-models 

example here:

{
  "data": [
    {
      "id": "string",
      "name": "string",
      "created": 1741818122,
      "description": "string",
      "architecture": {
        "input_modalities": [
          "text",
          "image"
        ],
        "output_modalities": [
          "text"
        ],
        "tokenizer": "GPT",
        "instruct_type": "string"
      },
      "top_provider": {
        "is_moderated": true,
        "context_length": 128000,
        "max_completion_tokens": 16384
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "web_search": "0",
        "internal_reasoning": "0",
        "input_cache_read": "0",
        "input_cache_write": "0"
      },
      "canonical_slug": "string",
      "context_length": 128000,
      "hugging_face_id": "string",
      "per_request_limits": {},
      "supported_parameters": [
        "string"
      ]
    }
  ]
}
✅ Add a data service named "updateAIModels"that pulls from openrouter  api at https://openrouter.ai/docs/api-reference/list-available-models and saves to new "ai_models" table.
✅ Add an api route that calls the "updateAIModels" service and can be called as a cron job.

## Market Detail Page
- [x] Create a new Market Detail page. Page should accept marketId as a query parameter. Page should display the market details and the most recent prediction for that market.


## Predictions
- Add necessary buttons Generate prediction button for all markets.


## UX
- [x] Fix Market amounts to return values from the database.
- Add Kalshi market updates
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