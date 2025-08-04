ALTER TABLE "events" ADD COLUMN "category" integer;--> statement-breakpoint
CREATE INDEX "idx_events_category" ON "events" USING btree ("category");