# BetterAI

A Next.js prediction market application that integrates with Polymarket and Colosseum APIs, featuring AI-powered market predictions.

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



## Features

- **AI-Powered Predictions**: Generate predictions for prediction markets using advanced AI models
- **Market Integration**: Connect with Polymarket and other prediction market platforms
- **Real-time Data**: Live market data and prediction tracking
- **User Authentication**: Secure authentication using Privy
- **Responsive Design**: Modern UI built with shadcn/ui components

## Data Pipeline Overview

When a user chooses to invoke an AI prediction, the following data pipeline is triggered:

1.  **Fetch Market Data**: The system first retrieves all available information about the selected prediction market from the internal database. This includes the market's question, description, rules, and current standing.

2.  **AI-Powered Data Source Identification**: The application then makes an initial call to a powerful AI model (e.g., a leading model on OpenRouter). The purpose of this call is not to predict the outcome, but to ask a meta-question: *"Given this prediction market, what types of data, datasets, and information sources would be most valuable for making an accurate prediction?"* The AI's response guides the next steps of data gathering.

3.  **Targeted Information Retrieval**: Based on the AI's recommendation, the `research-service-v2` is invoked. This service performs multi-source research using Exa.ai semantic search and Grok X/Twitter analysis to gather the latest and most relevant information.

4.  **Optional Real-time Web Crawl (Future)**: An optional step may be added to perform a real-time web crawl of specific, high-value URLs identified in the previous step. This would provide the most up-to-the-minute information possible.

5.  **Final Prediction Synthesis**: Finally, all the gathered information—the initial market data, the AI-identified valuable data types, and the freshly retrieved information from the web—is compiled into a comprehensive context. This entire context is then fed into a final AI call to generate the ultimate prediction for the market's outcome.

This multi-step process ensures that the final prediction is not just based on a single AI model's general knowledge, but is informed by a rich, relevant, and timely set of data specifically tailored to the market in question.

## Legal Reminder
Consistently describe the app as a way to "enable the user to invoke multiple LLMs with enriched datasets". Emphasize that this is a tool for analysis, not a financial advisor.




## Authentication

This application uses [Privy](https://privy.io/) for user authentication following their official best practices:

### Client-Side Authentication
- Uses `usePrivy()` hook for authentication state management
- Implements bearer token approach for API requests
- Automatic token refresh and error handling

### Server-Side Authentication
- All privileged API endpoints require authentication
- Uses Privy's server SDK for token verification
- User context is available in all authenticated requests


## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `pnpm dev`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Privy
- **UI**: shadcn/ui with Tailwind CSS
- **AI**: OpenRouter API integration
- **Deployment**: Vercel

