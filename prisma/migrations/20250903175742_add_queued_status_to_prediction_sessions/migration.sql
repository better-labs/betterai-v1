-- AlterEnum
ALTER TYPE "public"."PredictionSessionStatus" ADD VALUE 'queued';

-- DropIndex
DROP INDEX "public"."idx_event_tags_event_id";

-- DropIndex
DROP INDEX "public"."idx_events_volume_desc";

-- DropIndex
DROP INDEX "public"."idx_markets_event_id_volume";

-- DropIndex
DROP INDEX "public"."idx_predictions_market_id_created";
