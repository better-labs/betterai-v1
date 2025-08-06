CREATE TABLE "market_query_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_id" text,
	"model_name" text NOT NULL,
	"system_message" text,
	"user_message" text NOT NULL,
	"response" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "market_query_cache" ADD CONSTRAINT "market_query_cache_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_market_query_cache_created_at" ON "market_query_cache" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_market_query_cache_market_id" ON "market_query_cache" USING btree ("market_id");