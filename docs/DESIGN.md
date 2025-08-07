# BetterAI App Design Doc

## Overview
**Purpose**: enable the user to invoke multiple LLMs with enriched datasets to predict the outcome of a given market (like Polymarket or Kalshi). The AI is a tool for analysis. 

**Thesis**: 
Everyone, regardless of their technical skill, should be able to invoke the world’s best super intelligences, enriched from the best data (context), from a single mouse click, to enhance a given bet.
Each ai platform will improve its ease of use and capability over time, but those improvements will be limited to their own models. AI aggregators like Perplexity have brought the power of multiple AIs to non-technical consumers, yet those user experience are not optimized for specific use cases.

**Problem**:
The average prediction market user does not have the data or ai engineering expertise or time to maximize the use of the latest AI models. 

**Solution**: Leverage world-class AI models with world class enriched data to make smarter predictions on trending markets for consumer users.


## User Flows & Roadmap
To maximise early user value while keeping scope tight, the flows are grouped into phased releases. Each phase ships a complete slice of functionality and sets the stage for the next.

### Phase 0 – Private Alpha (MVP)
1. **AI Market Prediction (core loop)**
   - User sees the top trending Polymarket events.
   - Clicks “Predict” ➞ receives an AI-generated outcome (confidence + share link).
   - Advanced options (paid model, extra data enrichment) can be deferred.

2. **Account Creation & Authentication**
   - Lightweight email / social login.
   - Required for persisting predictions and preparing for payments.

*Alpha note*: Provide a free daily credit pool; skip the funding flow for now.

### Phase 1 – Public Beta
3. **Funding Balance**
   - Users add funds to access premium models or additional predictions.
   - Simple checkout with minimal amount and stored balance.

4. **Activity Page**
   - Displays past predictions, cost, timestamp and deep-link to detail view.
   - Encourages retention and social sharing.

### Phase 2 – Power-User Suite
5. **My Portfolio**
   - Connect external prediction-market accounts; show active positions and allow re-running AI predictions.
   - Optionally alert users to meaningful price deltas.

6. **Market Alpha**
   - Surfaces markets with the highest mis-pricing signal based on batch predictions.
   - Acts as discovery feed and upsell path to paid predictions.

7. **Search / Voice / Browser Extension**
   - Convenience and distribution channels once the core loop and monetisation are validated.

### Deferred / Experimental
- **Trust-but-Verify (IPFS/S3 audit trail)** – revisit after paid traction.

## Data Pipeline

When a user chooses to invoke an AI prediction, the following data pipeline is triggered:

1.  **Fetch Market Data**: The system first retrieves all available information about the selected prediction market from the internal database. This includes the market's question, description, rules, and current standing.

2.  **AI-Powered Data Source Identification**: The application then makes an initial call to a powerful AI model (e.g., a leading model on OpenRouter). The purpose of this call is not to predict the outcome, but to ask a meta-question: *"Given this prediction market, what types of data, datasets, and information sources would be most valuable for making an accurate prediction?"* The AI's response guides the next steps of data gathering.

3.  **Targeted Information Retrieval**: Based on the AI's recommendation, the `market-research-service` is invoked. This service performs a targeted search across the web and other specified data sources to gather the latest and most relevant information.

4.  **Optional Real-time Web Crawl (Future)**: An optional step may be added to perform a real-time web crawl of specific, high-value URLs identified in the previous step. This would provide the most up-to-the-minute information possible.

5.  **Final Prediction Synthesis**: Finally, all the gathered information—the initial market data, the AI-identified valuable data types, and the freshly retrieved information from the web—is compiled into a comprehensive context. This entire context is then fed into a final AI call to generate the ultimate prediction for the market's outcome.

This multi-step process ensures that the final prediction is not just based on a single AI model's general knowledge, but is informed by a rich, relevant, and timely set of data specifically tailored to the market in question.

## Legal
Consistently describe the app as a way to "enable the user to invoke multiple LLMs with enriched datasets". Emphasize that this is a tool for analysis, not a financial advisor.