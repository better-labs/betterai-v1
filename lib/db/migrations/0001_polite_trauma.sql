ALTER TABLE "events" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "resolution_source" text;--> statement-breakpoint
CREATE INDEX "idx_events_start_date" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_markets_slug" ON "markets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_markets_start_date" ON "markets" USING btree ("start_date");