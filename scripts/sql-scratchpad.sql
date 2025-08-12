SELECT t.*
FROM "public"."tags" AS t
JOIN "public"."event_tags" AS et
  ON et."tag_id" = t."id"
WHERE et."event_id" = '37048';