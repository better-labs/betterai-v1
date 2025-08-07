-- CreateTable
CREATE TABLE "public"."ai_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created" INTEGER,
    "description" TEXT,
    "architecture" JSONB,
    "top_provider" JSONB,
    "pricing" JSONB,
    "canonical_slug" TEXT,
    "context_length" INTEGER,
    "hugging_face_id" TEXT,
    "per_request_limits" JSONB,
    "supported_parameters" JSONB,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "icon" TEXT,
    "tags" JSONB,
    "category" INTEGER,
    "volume" DECIMAL DEFAULT 0,
    "end_date" TIMESTAMP(6),
    "market_provider" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_query_cache" (
    "id" SERIAL NOT NULL,
    "market_id" TEXT,
    "model_name" TEXT NOT NULL,
    "system_message" TEXT,
    "user_message" TEXT NOT NULL,
    "response" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_query_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."markets" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "event_id" TEXT,
    "outcome_prices" DECIMAL[],
    "volume" DECIMAL DEFAULT 0,
    "liquidity" DECIMAL DEFAULT 0,
    "category" TEXT,
    "description" TEXT,
    "active" BOOLEAN,
    "closed" BOOLEAN,
    "end_date" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT,
    "start_date" TIMESTAMP(6),
    "resolution_source" TEXT,
    "outcomes" TEXT[],

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predictions" (
    "id" SERIAL NOT NULL,
    "user_message" TEXT NOT NULL,
    "market_id" TEXT,
    "prediction_result" JSONB NOT NULL,
    "model_name" TEXT,
    "system_prompt" TEXT,
    "ai_response" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "probability" DECIMAL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ai_models_canonical_slug" ON "public"."ai_models"("canonical_slug" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_models_context_length" ON "public"."ai_models"("context_length" ASC);

-- CreateIndex
CREATE INDEX "idx_ai_models_name" ON "public"."ai_models"("name" ASC);

-- CreateIndex
CREATE INDEX "idx_events_category" ON "public"."events"("category" ASC);

-- CreateIndex
CREATE INDEX "idx_events_end_date" ON "public"."events"("end_date" ASC);

-- CreateIndex
CREATE INDEX "idx_events_slug" ON "public"."events"("slug" ASC);

-- CreateIndex
CREATE INDEX "idx_events_start_date" ON "public"."events"("start_date" ASC);

-- CreateIndex
CREATE INDEX "idx_events_volume" ON "public"."events"("volume" ASC);

-- CreateIndex
CREATE INDEX "idx_market_query_cache_created_at" ON "public"."market_query_cache"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_market_query_cache_market_id" ON "public"."market_query_cache"("market_id" ASC);

-- CreateIndex
CREATE INDEX "idx_markets_end_date" ON "public"."markets"("end_date" ASC);

-- CreateIndex
CREATE INDEX "idx_markets_event_id" ON "public"."markets"("event_id" ASC);

-- CreateIndex
CREATE INDEX "idx_markets_slug" ON "public"."markets"("slug" ASC);

-- CreateIndex
CREATE INDEX "idx_markets_start_date" ON "public"."markets"("start_date" ASC);

-- CreateIndex
CREATE INDEX "idx_markets_volume" ON "public"."markets"("volume" ASC);

-- CreateIndex
CREATE INDEX "idx_predictions_created_at" ON "public"."predictions"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_predictions_market_id" ON "public"."predictions"("market_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."market_query_cache" ADD CONSTRAINT "market_query_cache_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."markets" ADD CONSTRAINT "markets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."predictions" ADD CONSTRAINT "predictions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

