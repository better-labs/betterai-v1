SELECT
  p.user_message,
  p.probability as model_predicted_price,
  m.outcome_prices[1] AS market_price,
  ABS((m.outcome_prices[1] - p.probability)) AS price_probability_diff,
  e.slug AS event_slug,
  CONCAT('https://polymarket.com/event/', e.slug) AS event_url,
  p.model_name,
  p.created_at
FROM
  predictions p
  JOIN markets m ON p.market_id = m.id
  JOIN events e ON m.event_id = e.id
ORDER BY
  price_probability_diff DESC;