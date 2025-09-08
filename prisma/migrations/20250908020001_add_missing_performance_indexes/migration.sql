-- CreateIndex
CREATE INDEX "idx_event_tags_event_id" ON "public"."event_tags"("event_id");

-- CreateIndex
CREATE INDEX "idx_markets_event_id_volume" ON "public"."markets"("event_id", "volume");

-- CreateIndex
CREATE INDEX "idx_predictions_market_id_created_at" ON "public"."predictions"("market_id", "created_at");
