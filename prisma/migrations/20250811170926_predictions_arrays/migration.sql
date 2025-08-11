/*
  Warnings:

  - You are about to drop the column `probability` on the `predictions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."predictions" DROP COLUMN "probability",
ADD COLUMN     "outcomes" TEXT[],
ADD COLUMN     "outcomes_probabilities" DECIMAL[];
