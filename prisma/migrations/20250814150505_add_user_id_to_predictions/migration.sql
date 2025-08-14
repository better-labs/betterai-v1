-- AlterTable
ALTER TABLE "predictions" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_predictions_user_id" ON "predictions"("user_id");
