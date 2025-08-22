-- Ensure created_at has no NULLs, then enforce NOT NULL
BEGIN;

-- Backfill any null timestamps to current time
UPDATE "public"."prediction_checks"
SET "created_at" = NOW()
WHERE "created_at" IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE "public"."prediction_checks"
ALTER COLUMN "created_at" SET NOT NULL;

COMMIT;


