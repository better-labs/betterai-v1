# Benchmark

Thesis: leading AI models are close to beating our most difficult benchmarks (humanity's last exam, ARC-AGI, etc). The world needs better, infinitely difficult benchmarks, to properly measure the AI model's intelligence growth beyond super intelligence. Prediction markets are a good candidate for this.

Set up the benchmark initially but do it manually and set the parameters of something that can be re-created among the top model competition like a category of 10 different areas and run the same manually each week


## ***Benchmark Design***

### Phase 1 — Simple, reproducible baseline (MVP)
- Source: Polymarket canonical `markets` table (kept current via `/api/cron/update-polymarket-data`).
- Selection: Top 50 markets by `volume` that end around 7 days from now (±24h). Implemented via `/api/cron/generate-batch-predictions`.
- Model: Start with low-cost, fast model: `google/gemini-2.5-flash-lite` (configurable). Store output in `predictions` with numeric `probability` and `prediction_result` JSON.
- Daily check: `/api/cron/prediction-check` computes AI probability vs. current market probability (first `outcomePrices[0]`), persists a lightweight record in (tbd)
- Metrics: Start with simple deltas; once outcomes resolve, compute Brier and calibration offline or as a follow‑up task.

Notes on categories: you may either exclude volatile categories (e.g., `cryptocurrency`) via `PREDICTION_CHECK_EXCLUDE_CATEGORIES`, or include all and segment results by category. Recommended: include all, but display category-segmented performance so crypto can be marked as less effective if needed.

### Phase 2 — Add evaluation quality and breadth
- Compute Brier score and calibration for resolved markets weekly.
- Compare multiple models in parallel on the same market set; report relative skill vs. market (Brier Skill Score).
- Expand selection criteria: per-category top-N, long/short horizon buckets, liquidity filters.
- Add guardrails: minimum liquidity, exclude ambiguous markets, deduplicate by similar questions.
- Produce weekly dashboard: overall and per-category metrics, model leaderboard, notable wins/losses.

### Categories Reference
Prediction Market Categories

1. Elections  
   * Description: Focused specifically on the outcomes of political elections and related events. This is separated from general geopolitics due to its high volume and specific nature.  
   * Includes: US Presidential/Midterm elections, global elections, primaries, leadership contests.  
2. Geopolitics & World Affairs  
   * Description: Covers conflicts, international relations, and policy decisions between nations, excluding specific election outcomes.  
   * Includes: Geopolitical conflicts, international treaties, foreign policy, political appointments.  
3. Economy & Economic Indicators  
   * Description: Macroeconomic trends and official data releases from government bodies.  
   * Includes: CPI, GDP growth, unemployment rates, Federal Reserve interest rate decisions.  
4. Financial Markets  
   * Description: Performance of traditional financial assets and markets.  
   * Includes: Stock indices (S\&P 500), individual stock prices, commodities, bonds.  
5. Cryptocurrency  
   * Description: All events related to the crypto ecosystem. It is separated from Financial Markets due to its unique technology, volatility, and community.  
   * Includes: Cryptocurrency prices (BTC, ETH), protocol upgrades, regulatory news, NFT markets.  
6. Science & Technology  
   * Description: Scientific breakthroughs and technological advancements.  
   * Includes: AI model releases, computing milestones, biotech approvals (FDA), space exploration events.  
7. Business & Corporate  
   * Description: Company-specific events and milestones, distinct from their public market performance.  
   * Includes: Product launches, CEO changes, merger & acquisition outcomes, quarterly earnings reports.  
8. Sports  
   * Description: The outcomes of sporting events and leagues.  
   * Includes: Game winners (MLB, NFL, etc.), championship outcomes, player awards.  
9. Culture & Entertainment  
   * Description: Events in media, arts, and broader social trends.  
   * Includes: Box office results, award shows (Oscars, Grammys), media events, celebrity news, social phenomena.  
10. Climate & Environment  
    * Description: Predictions related to environmental data, climate change, and weather events.  
    * Includes: Global temperature records, hurricane landfalls, carbon emission levels, environmental policy.




# **Appendix**

## ***Step 3: Benchmark Evaluation Metrics***

Accuracy alone is a poor measure for probabilistic forecasts. You need more sophisticated metrics.

1. **Brier Score (Primary Metric):** This is the gold standard. It measures the mean squared error of the probability forecast. It rewards both accuracy and good calibration. The formula is:  
    B=N1​t=1∑N​(ft​−ot​)2  
    Where:  
   * N is the number of forecasts.  
   * f\_t is the AI's forecast probability for event t.  
   * o\_t is the actual outcome of event t (1 if it happened, 0 if it did not).  
   * **A lower Brier score is better.** A perfect score is 0\.  
2. **Calibration:** How reliable are the AI's probabilities? When the AI predicts 70%, does it happen 70% of the time? You can visualize this with a calibration plot, binning predictions (e.g., all predictions between 65-75%) and plotting the average forecast vs. the actual frequency of outcomes in that bin.  
3. **Relative Skill Score:** How much better is the AI than a baseline? The most important baseline is the market itself.  
   * **Brier Skill Score:** BSS=1−fracB\_AIB\_Market  
   * A positive score means the AI is more accurate than the market.  
   * A negative score means the market is more accurate.  
   * This directly tests if the AI has an "edge" over the collective intelligence of human traders.  
4. **Qualitative Rationale Analysis:**  
   * This is where you analyze the `rationale` text.  
   * Did the AI identify the correct causal factors?  
   * Did it miss a crucial piece of news?  
   * Was its reasoning sound, even if the outcome was a surprise?  
   * This analysis is critical for understanding the *intelligence* and failure modes of the model, directly supporting your thesis.

### **Putting It All Together: Your Weekly Dashboard**

You can now generate a weekly report or dashboard showing:

* **Overall Brier Score** for the AI and the Market baseline, tracked over time.  
* **Brier Scores by Super-Category** (e.g., Is the AI better at Tech than at Geopolitics?).  
* **Calibration Plots** for the AI.  
* **Leaderboard** of the most/least accurate predictions for the week.  
* **Category filters** to highlight segments (e.g., crypto marked “less effective”).

## ***Operational Jobs (CRON)***
- Update market data: `POST /api/cron/update-polymarket-data` (existing).
- Generate batch predictions: `POST /api/cron/generate-batch-predictions` (top 50 by volume ending ~7 days).
- Daily prediction checking: `POST /api/cron/prediction-check` (stores delta snapshots by category).

All endpoints are protected with `Authorization: Bearer ${CRON_SECRET}` and have matching `scripts/cron/*` trigger scripts.
* **Qualitative Insight of the Week:** Highlight one instance where the AI's rationale was particularly brilliant or spectacularly wrong, and explain why.