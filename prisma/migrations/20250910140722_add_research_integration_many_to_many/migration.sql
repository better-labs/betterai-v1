-- AlterTable
ALTER TABLE "public"."research_cache" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'legacy';

-- CreateTable
CREATE TABLE "public"."prediction_session_research_cache" (
    "id" TEXT NOT NULL,
    "prediction_session_id" TEXT NOT NULL,
    "research_cache_id" INTEGER NOT NULL,
    "used_in_generation" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_session_research_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_prediction_session_research_cache_session_id" ON "public"."prediction_session_research_cache"("prediction_session_id");

-- CreateIndex
CREATE INDEX "idx_prediction_session_research_cache_research_id" ON "public"."prediction_session_research_cache"("research_cache_id");

-- CreateIndex
CREATE INDEX "idx_prediction_session_research_cache_created_at" ON "public"."prediction_session_research_cache"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_prediction_session_research_cache" ON "public"."prediction_session_research_cache"("prediction_session_id", "research_cache_id");

-- CreateIndex
CREATE INDEX "idx_research_cache_source" ON "public"."research_cache"("source");

-- AddForeignKey
ALTER TABLE "public"."prediction_session_research_cache" ADD CONSTRAINT "prediction_session_research_cache_session_id_fk" FOREIGN KEY ("prediction_session_id") REFERENCES "public"."prediction_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."prediction_session_research_cache" ADD CONSTRAINT "prediction_session_research_cache_research_id_fk" FOREIGN KEY ("research_cache_id") REFERENCES "public"."research_cache"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
