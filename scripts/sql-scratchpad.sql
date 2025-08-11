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

-- Top 20 markets by volume with their questions
SELECT
  m.id,
  m.question,
  m.volume,
  m.liquidity,
  e.title AS event_title,
  e.slug AS event_slug,
  CONCAT('https://polymarket.com/event/', e.slug) AS event_url
FROM
  markets m
  LEFT JOIN events e ON m.event_id = e.id
WHERE
  m.volume IS NOT NULL
  AND m.volume > 0
ORDER BY
  m.volume DESC
LIMIT 20;

-- DIAGNOSTIC QUERIES BELOW

-- Check if markets table exists and has data
SELECT 
  COUNT(*) as total_markets,
  COUNT(CASE WHEN volume IS NOT NULL THEN 1 END) as markets_with_volume,
  COUNT(CASE WHEN volume > 0 THEN 1 END) as markets_with_positive_volume,
  COUNT(CASE WHEN volume IS NULL THEN 1 END) as markets_with_null_volume
FROM markets;

-- Check volume distribution
SELECT 
  CASE 
    WHEN volume IS NULL THEN 'NULL'
    WHEN volume = 0 THEN 'ZERO'
    WHEN volume > 0 AND volume <= 1000 THEN '1-1000'
    WHEN volume > 1000 AND volume <= 10000 THEN '1001-10000'
    WHEN volume > 10000 AND volume <= 100000 THEN '10001-100000'
    ELSE '100000+'
  END as volume_range,
  COUNT(*) as count
FROM markets
GROUP BY volume_range
ORDER BY 
  CASE volume_range
    WHEN 'NULL' THEN 1
    WHEN 'ZERO' THEN 2
    WHEN '1-1000' THEN 3
    WHEN '1001-10000' THEN 4
    WHEN '10001-100000' THEN 5
    ELSE 6
  END;

-- Check top 10 markets by volume (without filters)
SELECT
  m.id,
  m.question,
  m.volume,
  m.liquidity,
  e.title AS event_title
FROM
  markets m
  LEFT JOIN events e ON m.event_id = e.id
ORDER BY
  COALESCE(m.volume, 0) DESC
LIMIT 10;


-- Categories distribution for markets with significant volume
SELECT COALESCE(e.category::text, 'Uncategorized') as category,
       COUNT(*)                              as market_count,
       SUM(m.volume)                         as total_volume,
       ROUND(AVG(m.volume)::numeric, 2)      as avg_volume,
       COUNT(DISTINCT e.id)                  as unique_events
FROM markets m
         LEFT JOIN events e ON m.event_id = e.id
WHERE m.volume > 0 -- Only consider markets with positive volume
GROUP BY COALESCE(e.category::text, 'Uncategorized')
ORDER BY total_volume DESC;

-- Top categories by volume with sample markets
WITH TopMarkets AS (SELECT e.category,
                           m.question,
                           m.volume,
                           ROW_NUMBER() OVER (PARTITION BY e.category ORDER BY m.volume DESC) as rank_in_category
                    FROM markets m
                             JOIN events e ON m.event_id = e.id
                    WHERE m.volume > 0)
SELECT category,
       COUNT(*) as total_markets,
       STRING_AGG(
               CASE
                   WHEN rank_in_category <= 3
                       THEN question || ' (' || volume || ')'
                   END,
               '; '
       )        as top_3_markets_by_volume
FROM TopMarkets
GROUP BY category
ORDER BY COUNT(*) DESC;

-- Top 20 markets by volume with their questions for cryptocurrency events
SELECT
  m.question
FROM
  markets AS m
  JOIN events AS e ON e.id = m.event_id
WHERE
  m.volume IS NOT NULL
  AND m.volume > 0
  AND e.category::text ILIKE 'cryptocurrency'
ORDER BY
  m.volume DESC
LIMIT 20;




-- Find market with "freakier friday" and related predictions and checks
WITH target_market AS (SELECT m.id, m.question
                       FROM markets m
                       WHERE LOWER(m.question) LIKE '%freakier friday%'
                          OR LOWER(m.description) LIKE '%freakier friday%')
SELECT m.id          AS market_id,
       m.question    AS market_question,
       m.outcome_prices[1],
       p.probability AS predicted_probability,
       pc.delta    AS prediction_check_delta,
       p.id          AS prediction_id,
       p.created_at  AS prediction_created_at,
       pc.id         AS prediction_check_id,
       pc.market_closed,
       pc.market_category,
       pc.created_at AS check_created_at
FROM target_market tm
         JOIN markets m ON m.id = tm.id
         LEFT JOIN predictions p ON p.market_id = m.id
         LEFT JOIN prediction_checks pc ON pc.prediction_id = p.id
ORDER BY pc.created_at


-- Get market outcomes and prices for top 20 markets by volume
SELECT m.id,
       m.question,
       m.outcomes,
       m.outcome_prices,
       e.title AS event_title,
       e.slug  AS event_slug,
       m.volume,
       m.liquidity
FROM markets m
         LEFT JOIN events e ON m.event_id = e.id
WHERE m.volume IS NOT NULL
  AND m.volume > 0
ORDER BY m.volume DESC
LIMIT 20;