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
CREATE INDEX "idx_ai_models_name" ON "ai_models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ai_models_context_length" ON "ai_models" USING btree ("context_length");--> statement-breakpoint
CREATE INDEX "idx_ai_models_canonical_slug" ON "ai_models" USING btree ("canonical_slug");