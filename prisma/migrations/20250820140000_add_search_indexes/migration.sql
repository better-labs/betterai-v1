-- Add search performance indexes for full-text search

-- Markets table indexes for search performance
CREATE INDEX IF NOT EXISTS idx_markets_question_search 
ON "markets" USING gin(to_tsvector('english', "question"));

CREATE INDEX IF NOT EXISTS idx_markets_description_search 
ON "markets" USING gin(to_tsvector('english', COALESCE("description", '')));

CREATE INDEX IF NOT EXISTS idx_markets_active_volume 
ON "markets"("active", "volume" DESC) WHERE "active" = true;

-- Events table indexes for search performance  
CREATE INDEX IF NOT EXISTS idx_events_title_search 
ON "events" USING gin(to_tsvector('english', "title"));

CREATE INDEX IF NOT EXISTS idx_events_description_search 
ON "events" USING gin(to_tsvector('english', COALESCE("description", '')));

CREATE INDEX IF NOT EXISTS idx_events_volume_desc 
ON "events"("volume" DESC);

-- Tags table indexes for search performance
CREATE INDEX IF NOT EXISTS idx_tags_label_search 
ON "tags" USING gin(to_tsvector('english', "label"));

CREATE INDEX IF NOT EXISTS idx_tags_label_lowercase 
ON "tags"(lower("label"));

-- EventTag junction table for tag-event relationships
CREATE INDEX IF NOT EXISTS idx_event_tags_event_id 
ON "event_tags"("event_id");

CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id 
ON "event_tags"("tag_id");

-- Additional performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_markets_event_id_volume 
ON "markets"("event_id", "volume" DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_market_id_created 
ON "predictions"("market_id", "created_at" DESC);