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

-- Select markets with "tesla" in question or description
SELECT
  m.id,
  m.question,
  m.description,
  m.slug,
  m.volume,
  m.active,
  m.closed,
  e.title AS event_title,
  e.slug AS event_slug
FROM
  markets m
  LEFT JOIN events e ON m.event_id = e.id
WHERE
  LOWER(m.question) LIKE '%tesla%'
  OR LOWER(m.description) LIKE '%tesla%'
ORDER BY
  m.volume DESC NULLS LAST;



