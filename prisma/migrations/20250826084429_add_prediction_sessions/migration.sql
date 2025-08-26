-- CreateEnum
CREATE TYPE "PredictionSessionStatus" AS ENUM ('initializing', 'researching', 'generating', 'finished', 'error');

-- CreateTable
CREATE TABLE "prediction_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "selected_models" TEXT[],
    "status" "PredictionSessionStatus" NOT NULL DEFAULT 'initializing',
    "step" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "prediction_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prediction_sessions" ADD CONSTRAINT "prediction_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prediction_sessions" ADD CONSTRAINT "prediction_sessions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable
ALTER TABLE "predictions" ADD COLUMN "session_id" TEXT;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_session_id_prediction_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "prediction_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "idx_prediction_sessions_user_id" ON "prediction_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_prediction_sessions_market_id" ON "prediction_sessions"("market_id");

-- CreateIndex
CREATE INDEX "idx_prediction_sessions_status" ON "prediction_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_prediction_sessions_created_at" ON "prediction_sessions"("created_at");

-- CreateIndex
CREATE INDEX "idx_predictions_session_id" ON "predictions"("session_id");