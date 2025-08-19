-- AlterTable
ALTER TABLE "public"."predictions" ADD COLUMN     "experiment_notes" TEXT,
ADD COLUMN     "experiment_tag" TEXT;

-- CreateIndex
CREATE INDEX "idx_predictions_experiment_tag" ON "public"."predictions"("experiment_tag");
