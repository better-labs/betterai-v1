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

market-card:
- <event.title?>
- <market.groupItemTitle>
- Label: Market Probability
    - Outlined grid: outcomes x outcomePrices
    - Hover text: Last Updated: ___
- Label: AI Prediction
    - Outlined grid: ai outcomes x outcomePrices
    - Hover text: Last Generated: ___
- Label: AI Delta
    - <abs(mo0-p0)>
- Button: Generate New AI Prediction


Reasoning-card: exists

Verifiable-Prediction-Prompt-Card: exists



