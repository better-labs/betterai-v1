/*
  Warnings:

  - You are about to drop the `market_query_cache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."market_query_cache" DROP CONSTRAINT "market_query_cache_market_id_markets_id_fk";

-- DropTable
DROP TABLE "public"."market_query_cache";

-- CreateTable
CREATE TABLE "public"."research_cache" (
    "id" SERIAL NOT NULL,
    "market_id" TEXT,
    "model_name" TEXT NOT NULL,
    "system_message" TEXT,
    "user_message" TEXT NOT NULL,
    "response" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prediction_checks" (
    "id" SERIAL NOT NULL,
    "prediction_id" INTEGER,
    "market_id" TEXT,
    "ai_probability" DECIMAL,
    "market_probability" DECIMAL,
    "delta" DECIMAL,
    "abs_delta" DECIMAL,
    "market_closed" BOOLEAN,
    "market_category" "public"."Category",
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_research_cache_created_at" ON "public"."research_cache"("created_at");

-- CreateIndex
CREATE INDEX "idx_research_cache_market_id" ON "public"."research_cache"("market_id");

-- CreateIndex
CREATE INDEX "idx_prediction_checks_created_at" ON "public"."prediction_checks"("created_at");

-- CreateIndex
CREATE INDEX "idx_prediction_checks_market_id" ON "public"."prediction_checks"("market_id");

-- CreateIndex
CREATE INDEX "idx_prediction_checks_prediction_id" ON "public"."prediction_checks"("prediction_id");

-- AddForeignKey
ALTER TABLE "public"."research_cache" ADD CONSTRAINT "research_cache_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."prediction_checks" ADD CONSTRAINT "prediction_checks_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."prediction_checks" ADD CONSTRAINT "prediction_checks_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
