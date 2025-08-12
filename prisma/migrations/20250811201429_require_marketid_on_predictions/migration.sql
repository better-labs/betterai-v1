/*
  Warnings:

  - Made the column `market_id` on table `predictions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."predictions" ALTER COLUMN "market_id" SET NOT NULL;
