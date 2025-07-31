# Market prediction app

## Overview

Purpose: enable the user to invoke multiple LLMs with enriched datasets to predict the outcome of a given market (like Polymarket or Kalshi). The AI is a "coach" for the user betting on each outcome.

Thesis: 
* Everyone, regardless of their technical skill, should be able to invoke the world's best super intelligences, enriched from the best data (context), from a single mouse click, to enhance a given bet.
* Each ai platform will improve its ease of use and capability over time, but those improvements will be limited to their own models. AI aggregators like Perplexity have brought the power of multiple AIs to non-technical consumers, yet those user experience are not optimized for specific use cases.

Problem:
* The average prediction market user does not have the data or ai engineering expertise or time to maximize the use of the latest AI models. 



## User Flows

Initial Release

User Flow1: AI Market Prediction
* User logs into the app and sees the top 10 trending events on polymarket. Those markets are pulled by the app from polymarket api (https://gamma-api.polymarket.com/)
* User selects one of the markets and is presented with options to have an AI predict the most likely bet (outcome) of the market.
* User is given the option to choose between a more expensive (paid) latest AI model
* User is given the option to enrich the AI coach with a given dataset (Twitter/X, News, historical sports stats, etc.)
* User clicks "Predict" with a given AI model
    * If user is logged in and has account balance: the app initiates a call to the backend app to initiate an AI prediction for the market.
    * If not, they are prompted to login or add funds to their balance.

User Flow2: Account Creation and Authentication
* User creates an account and authenticates with the provider of their choice.

User Flow3: Funding Balance
* User clicks on "Add Funds".
* User follows checkout flow to add minimum funds
* User now has a positive account balance to fund predictions.

