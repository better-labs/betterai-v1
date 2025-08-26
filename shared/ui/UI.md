UI Layout System

Header:
* Logo
* About
* Search
* Menu


Landing Page:
* Trending AI Market Predictions
* “Topics”: // Tag Labels
* [MarketCards]: markets with prediction in the last 24 hours, ranked by volume in the past 24 hrs
* Show top 10
* <click to show more>
* (That’s it)
Status: nearly complete , limit to show 1 market per event with the highest value for "Delta"


Market page:
* [MarketCard]
* Past Predictions:
    * [Prediction Cards]
    * Show top 10
    * <click to show more>


Prediction page: ..
* <MarketCard>
    * With current prediction shown in AI Delta
* <Reasoning Card>
* <Verifiable Prediction Prompt Card>
* Past Predictions Label:
    * Show top 10
    * <click to show more>

Event page:
* <EventIcon>
* <Event name value>
* <Market cards ordered by marketoutcome0>

Search results page:
.. todo

market-card: [half complete]
- EventIcon, event.title>
- <market.groupItemTitle> (temp: market.question)
- StatsGroup: Label: Market Probability
    - Stats: Outlined grid: outcomes x outcomePrices
    - Hover text: Last Updated: ___
- StatsGroup: Label: AI Prediction
    - Outlined grid: ai outcomes x outcomePrices
    - Hover text: Last Generated: ___
- StatsGroup: Label: AI Delta
    - Stats: absolute(market outcomes[0] - aiprobability[0])
- Button: Generate New AI Prediction
Status: modify to show:  <market.groupItemTitle> , integrate generate new AI button

Reasoning-card: exists

Verifiable-Prediction-Prompt-Card: exists



