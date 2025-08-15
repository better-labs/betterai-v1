# BetterAI App Design Doc

## Overview
**Purpose**: enable a non-technical consumer user to invoke multiple AI models with enriched datasets to predict the likely outcome of a given predictionmarket (like Polymarket, Kalshi, PredictIt, etc).

**Key Hypotheses**: 
- Value Prop Hypothesis:
   - Everyone, regardless of their technical skill, should be able to invoke the world’s best super intelligences, enriched from the best data (context), from a single mouse click, to enhance a given bet.
   - Each ai platform will improve its ease of use and capability over time, but those improvements will be limited to their own models. AI aggregators like Perplexity have brought the power of multiple AIs to non-technical consumers, yet those user experience are not optimized for specific use cases.
- Usability Hypothesis: A first-time user can get at least a small initial value immediately when landing on the page. User then gets unique, bespoke value for their interests within the first 30-45 seconds of using the app.
- AI Trust Hypothesis: TBD: need to research further how much trust the users want in the AI's predictions.
- Engagement Hypothesis: (work in progress) Providing users with a starting balance will lead to triggering at least 10 predictions in their first week.


**Problem**:
The average prediction market user does not have the data or ai engineering expertise or time to maximize the use of the latest AI models. 

**Solution**: Leverage world-class AI models with world class enriched data to make smarter predictions on trending markets for consumer users.


## Phased Design Features

### Phase 0 – Trust & Core Loop (Private Beta)


- Landing page: "Today's Top Market Insights" (curated quality over quantity), "last updated timestamp". Track record:  "AI predicted X correctly this week".

- Prediction detail page: user navigates to a prediction detail page. Clicks “Predict” ➞ receives an AI-generated outcome (confidence + share link). User-selectable model providers (ChatGPT, Gemini, Grok, Claude) OR 2-3 will be chosen automatically by default.
  - Go to Prediction Market: user can click through to the prediction market page on Polymarket.
  - "Explain Your Reasoning" — Let users drill down into why the AI made this prediction. Justify premium pricing — Deeper analysis commands higher prices than single predictions.
  - "Compare to Market" — Show how AI prediction differs from current market prices.
  - Verifiable Prediction: share exact prompt and dataset used. Valuable for trust in financial context; enables reproducibility and competitive advantage.

- Portfolio Watcher v1: import your active portfolio via public URL from Polymarket only. Enable users to manually select markets and trigger predictions.


- Account Creation & Authentication: Lightweight login via maybe Clerk or Auth.js or similar. Required for persisting predictions and preparing for payments.  *Alpha note*: Provide a free daily credit pool; skip the funding flow for now. Each new user signup gets 100 free credits, reset daily to at least 100.


### Phase 1 – Retention & Discovery (Public Beta Free to use)
- Funding Balance: Users add funds to access premium models or additional predictions. Simple checkout with minimal amount and stored balance.

- Activity Page: Displays past predictions, cost, timestamp and deep-link to detail view. Encourages retention and social sharing.

- Prediction detail page: "Update Prediction" — Re-run predictionwith latest data

- "Track This Prediction":
    Simple bookmark/follow feature
   - "Notify me when market resolves" creates return reason for users to come back.

- Market and Prediction Detail view: "Similar Markets" — Show related predictions user might be interested in. Benefit: user retention.

### Phase 2 – Portfolio + Power-User Suite

- Portfolio Watcher v2 "Active Agent": import your active portfolio from Polymarket. Prediction engine runs daily for each market in your portfolio. Get alerted when the AI prediction price difference exceeds a configurable threshold.

- My Portfolio: Connect external prediction-market accounts; show active positions and allow re-running AI predictions. Optionally alert users to meaningful price deltas.

- Market Alpha: Surfaces markets with the highest mis-pricing signal based on batch predictions. Acts as discovery feed and upsell path to paid predictions.

- Prediction detail page: "Set Alert" — Notify when market moves significantly vs AI prediction.

- Enable payments via Stripe, Coinbase, etc. to purchase more credits or a subscription.



### Future Features Not Yet Scheduled

High Value

- "What Could Change This?" — Show key events/factors that could flip the prediction
- "Prediction Performance" — Show simple AI accuracy stats

Medium Value
- "Prediction Performance" — Show simple AI accuracy stats
- Adding BI reporting via tools like Cube.js

- Portfolio Watcher Daily News: import your active portfolio from Polymarket. Get daily news on key events that impact your active bets.

- Conversational prediction analysis: chat with your prediction. Strong engagement; helps users understand reasoning; extends session value. 
- Allow power users to inject additionalUserMessageContext. Valuable for advanced users; consider guided prompts vs freeform.
- Mobile App, Browser Extension: additional distribution channels once the core loop and monetisation are validated.
- Confidence score: add a confidence score to the prediction where the AI defines their level of confidence in the prediction.

Low Value
- Trust-but-Verify: each prediction includes a public link to the prompt and dataset used (IPFS/S3 audit trail).
- A/B/C testing of prompts/datasets — Critical internally but indirect user value; foundation for other features  
- Harvest learnings from betters — Indirect benefit; significant privacy/legal complexity
- Release predictions DB as open dataset — Community/marketing value; low direct user impact
- Voice: Gemini live conversation with the AI on its prediction.

### Open Questions for User Value
- Do users want to see the AI's confidence score?
- Do users care about AI model selection?
- Do users care about dataset used?




## Data Pipeline Overview

When a user chooses to invoke an AI prediction, the following data pipeline is triggered:

1.  **Fetch Market Data**: The system first retrieves all available information about the selected prediction market from the internal database. This includes the market's question, description, rules, and current standing.

2.  **AI-Powered Data Source Identification**: The application then makes an initial call to a powerful AI model (e.g., a leading model on OpenRouter). The purpose of this call is not to predict the outcome, but to ask a meta-question: *"Given this prediction market, what types of data, datasets, and information sources would be most valuable for making an accurate prediction?"* The AI's response guides the next steps of data gathering.

3.  **Targeted Information Retrieval**: Based on the AI's recommendation, the `market-research-service` is invoked. This service performs a targeted search across the web and other specified data sources to gather the latest and most relevant information.

4.  **Optional Real-time Web Crawl (Future)**: An optional step may be added to perform a real-time web crawl of specific, high-value URLs identified in the previous step. This would provide the most up-to-the-minute information possible.

5.  **Final Prediction Synthesis**: Finally, all the gathered information—the initial market data, the AI-identified valuable data types, and the freshly retrieved information from the web—is compiled into a comprehensive context. This entire context is then fed into a final AI call to generate the ultimate prediction for the market's outcome.

This multi-step process ensures that the final prediction is not just based on a single AI model's general knowledge, but is informed by a rich, relevant, and timely set of data specifically tailored to the market in question.

## Legal Reminder
Consistently describe the app as a way to "enable the user to invoke multiple LLMs with enriched datasets". Emphasize that this is a tool for analysis, not a financial advisor.

