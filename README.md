# Market prediction app

## Overview

Purpose: enable the user to invoke multiple LLMs with enriched datasets to predict the outcome of a given market (like Polymarket or Kalshi). The AI is a “coach” for the user betting on each outcome.

Thesis: everyone, regardless of their technical skill, should be able to invoke the world’s best super intelligences, enriched from the best data (context), from a single mouse click, to enhance a given bet.  



User Flow:
* User logs into the app and sees the top 10 trending markets on polymarket. Those markets are pulled by the app from polymarket api (https://gamma-api.polymarket.com/)  
* User selects one of the markets and is presented with options to have an AI predict the most likely bet (outcome) of the market.  
* User is given the option to choose between: using a more expensive paid latest greatest AI or free lower quality AI model, enrich the AI coach with a given dataset (News, Twitter/X, historical sports stats, etc.)  
* User clicks “Predict” with a given AI model, the app initiates a call to the backend app, then the backend app sends the query to Vercel AI Gateway [https://vercel.com/docs/ai-gateway](https://vercel.com/docs/ai-gateway) via  AI SDK to the AI model selected  
* User can only invoke the paid AI models if they have a positive balance in their account  
* User is given the option to purchase credits for the app using crypto or fiat


## Vercel Deployment

Your project is live at:

**[https://vercel.com/wes-floyds-projects/v0-better-ai](https://vercel.com/wes-floyds-projects/v0-better-ai)**

Build your app: Continue building your app on:

**[https://v0.dev/chat/projects/loL3MMncDpB](https://v0.dev/chat/projects/loL3MMncDpB)**

How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
