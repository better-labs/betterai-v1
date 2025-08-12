/*
  Warnings:

  - You are about to drop the column `market_category` on the `prediction_checks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."prediction_checks" DROP COLUMN "market_category";
