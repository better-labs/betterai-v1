SELECT
  m.id,
  m.question,
  m.end_date,
  e.category
FROM markets AS m
JOIN events AS e ON e.id = m.event_id
WHERE m.end_date >= (timestamptz '2025-08-17T10:20:34.275Z' AT TIME ZONE 'UTC')
  AND m.end_date <= (timestamptz '2025-08-30T10:20:34.275Z' AT TIME ZONE 'UTC')
ORDER BY m.end_date;
