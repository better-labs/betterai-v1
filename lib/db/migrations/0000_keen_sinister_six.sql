CREATE TABLE "ai_models" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created" integer,
	"description" text,
	"architecture" jsonb,
	"top_provider" jsonb,
	"pricing" jsonb,
	"canonical_slug" text,
	"context_length" integer,
	"hugging_face_id" text,
	"per_request_limits" jsonb,
	"supported_parameters" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text,
	"icon" text,
	"tags" jsonb,
	"category" integer,
	"volume" numeric DEFAULT '0',
	"trending_rank" integer,
	"end_date" timestamp,
	"market_provider" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"event_id" text,
	"outcome_prices" numeric[],
	"volume" numeric DEFAULT '0',
	"liquidity" numeric DEFAULT '0',
	"category" text,
	"description" text,
	"active" boolean,
	"closed" boolean,
	"end_date" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_message" text NOT NULL,
	"market_id" text,
	"prediction_result" jsonb NOT NULL,
	"model_name" text,
	"system_prompt" text,
	"ai_response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_models_name" ON "ai_models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ai_models_context_length" ON "ai_models" USING btree ("context_length");--> statement-breakpoint
CREATE INDEX "idx_ai_models_canonical_slug" ON "ai_models" USING btree ("canonical_slug");--> statement-breakpoint
CREATE INDEX "idx_events_volume" ON "events" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "idx_events_trending_rank" ON "events" USING btree ("trending_rank");--> statement-breakpoint
CREATE INDEX "idx_events_slug" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_events_end_date" ON "events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_events_category" ON "events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_markets_event_id" ON "markets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_markets_volume" ON "markets" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "idx_markets_end_date" ON "markets" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_predictions_created_at" ON "predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_predictions_market_id" ON "predictions" USING btree ("market_id");