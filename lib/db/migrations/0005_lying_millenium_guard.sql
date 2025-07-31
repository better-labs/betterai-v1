ALTER TABLE "events" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
CREATE INDEX "idx_events_end_date" ON "events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_markets_end_date" ON "markets" USING btree ("end_date");