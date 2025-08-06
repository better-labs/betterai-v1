# BetterAI App Design Doc


## Tagline: Leverage world-class AI models with enriched data to make smarter predictions on trending markets.

## Overview
**Purpose**: enable the user to invoke multiple LLMs with enriched datasets to predict the outcome of a given market (like Polymarket or Kalshi). The AI is a tool for analysis.

**Thesis**: 
Everyone, regardless of their technical skill, should be able to invoke the world’s best super intelligences, enriched from the best data (context), from a single mouse click, to enhance a given bet.
Each ai platform will improve its ease of use and capability over time, but those improvements will be limited to their own models. AI aggregators like Perplexity have brought the power of multiple AIs to non-technical consumers, yet those user experience are not optimized for specific use cases.

**Problem**:
The average prediction market user does not have the data or ai engineering expertise or time to maximize the use of the latest AI models. 

## User Flows
### Initial Release
**User Flow1: AI Market Prediction**
1. User logs into the app and sees the top 10 trending events on polymarket. Those markets are pulled by the app from polymarket api (https://gamma-api.polymarket.com/)
2. User selects one of the markets and is presented with options to have an AI predict the most likely bet (outcome) of the market.
3. User is given the option to choose between a more expensive (paid) latest AI model
4. User is given the option to enrich the AI coach with a given dataset (Twitter/X, News, historical sports stats, etc.)
5. User clicks “Predict” with a given AI model
6. If user is logged in and has account balance: the app initiates a call to the backend app to initiate an AI prediction for the market.
7. If not, they are prompted to login or add funds to their balance.
8. User is shown to a Prediction Detail result modal
9. User is given the prediction result and also a link to share. Sharability & SEO: Each prediction can have a dedicated URL, useful for social sharing, community discussions (on X, Discord, etc.), and even some SEO benefits.

**User Flow2: Account Creation and Authentication**
- User creates an account and authenticates with the provider of their choice.

**User Flow3: Funding Balance**
- User clicks on “Add Funds”.
- User follows checkout flow to add minimum funds
- User now has a positive account balance to fund predictions.

**User Flow4: Activity Page**
- User navigates to Activity Page from expandable hamburger menu
- User sees a list of all past predictions with a link to the prediction detail and their associated cost.

**User Flow5: Search Page**
- Future UX for Prediction Markets
- Chrome Extension // good for v2
- Add MCP Server user flow to future features
- Voice interaction

### Future User Flows
**User Flow: My Portfolio (Risk, Opportunity, flow name tbd)**
1. User clicks on My Portfolio page.
2. User clicks to integrate their active bets from prediction markets to the My Portfolio view.
3. User can choose to trigger an AI prediction for each current bet in their portfolio.
4. User then sees the delta between the current market price
5. User Flow: Alert My Portfolio: the user can track their current bids

**User Flow: Market Alpha**
(Term explanation: Often used in finance to denote a data-driven insight that suggests an opportunity for outperformance.)
1. User is shown the markets that have the highest Alpha Signal based on free low powered AI Prediction.
2. User is given the option to select markets and then trigger a higher quality paid AI Prediction.

**User Flow: Trust but verify mode with IPFS or s3**

## Legal
Consistently describe the app as a way to "enable the user to invoke multiple LLMs with enriched datasets". Emphasize that this is a tool for analysis, not a financial advisor.