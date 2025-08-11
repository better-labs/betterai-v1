SELECT markets.outcomes[1] as market_first_outcome,
       predictions.ai_response::json ->> 'outcome' as ai_predicted_outcome
FROM markets, predictions
WHERE markets.id = predictions.market_id /* Add your join condition here */;